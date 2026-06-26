import os
import requests as http_requests
from functools import wraps
from datetime import datetime, timedelta

import jwt
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

from models import db, User, Album, Rating

# ── App setup ────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app, supports_credentials=True)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"sqlite:///{os.path.join(BASE_DIR, 'vinyl_vault.db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# ── Config ────────────────────────────────────────────────────────────────────

DISCOGS_TOKEN = os.environ.get('DISCOGS_TOKEN', 'YOUR_DISCOGS_TOKEN_HERE')
DISCOGS_BASE  = 'https://api.discogs.com'
DISCOGS_HDR   = {
    'Authorization': f'Discogs token={DISCOGS_TOKEN}',
    'User-Agent': 'VinylVaultApp/1.0',
}

SECRET_KEY = os.environ.get('SECRET_KEY', 'vinyl-vault-dev-secret-change-me')
JWT_EXPIRY = timedelta(days=14)

with app.app_context():
    db.create_all()


# ── JWT helpers ───────────────────────────────────────────────────────────────

def make_token(user_id):
    payload = {
        'user_id': user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + JWT_EXPIRY,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_current_user():
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    payload = decode_token(header[7:])
    if not payload:
        return None
    return db.session.get(User, payload['user_id'])


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required.'}), 401
        return f(*args, **kwargs)
    return decorated


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data     = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400
    if len(username) < 3 or len(username) > 30:
        return jsonify({'error': 'Username must be 3-30 characters.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400
    if not username.replace('_','').replace('-','').isalnum():
        return jsonify({'error': 'Username: only letters, numbers, - and _.'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken.'}), 409

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({'token': make_token(user.id), 'user': user.to_dict()}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data     = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password.'}), 401

    return jsonify({'token': make_token(user.id), 'user': user.to_dict()})


@app.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    return jsonify(get_current_user().to_dict(include_stats=True))


# ── Discogs search proxy ──────────────────────────────────────────────────────

@app.route('/api/search', methods=['GET'])
def search_albums():
    q        = request.args.get('q', '').strip()
    page     = request.args.get('page', 1)
    per_page = request.args.get('per_page', 20)

    if not q:
        return jsonify({'error': 'Query parameter "q" is required.'}), 400

    try:
        resp = http_requests.get(
            f'{DISCOGS_BASE}/database/search',
            headers=DISCOGS_HDR,
            params={'q': q, 'type': 'release', 'page': page, 'per_page': per_page},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except http_requests.exceptions.Timeout:
        return jsonify({'error': 'Discogs API timed out.'}), 504
    except http_requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 502

    results = []
    for item in data.get('results', []):
        raw = item.get('title', '')
        if ' - ' in raw:
            artist, title = raw.split(' - ', 1)
        else:
            artist, title = 'Unknown Artist', raw
        results.append({
            'discogs_id': item.get('id'),
            'title':      title.strip(),
            'artist':     artist.strip(),
            'year':       str(item.get('year', '')),
            'thumb_url':  item.get('thumb', '') or item.get('cover_image', ''),
            'genre':      item.get('genre', []),
            'style':      item.get('style', []),
        })

    pag = data.get('pagination', {})
    return jsonify({
        'results': results,
        'total':   pag.get('items', 0),
        'page':    pag.get('page', 1),
        'pages':   pag.get('pages', 1),
    })


# ── Image proxy — fixes Discogs 403 errors ───────────────────────────────────

@app.route('/api/proxy-image', methods=['GET'])
def proxy_image():
    url = request.args.get('url', '')
    if not url or 'discogs' not in url:
        return '', 400
    try:
        r = http_requests.get(
            url,
            headers={
                'User-Agent': 'VinylVaultApp/1.0',
                'Referer':    'https://www.discogs.com/',
                'Accept':     'image/webp,image/apng,image/*,*/*;q=0.8',
            },
            timeout=8,
            stream=True,
        )
        content_type = r.headers.get('Content-Type', 'image/jpeg')
        return Response(r.content, content_type=content_type)
    except Exception:
        return '', 502


# ── Ratings CRUD (JWT protected) ──────────────────────────────────────────────

@app.route('/api/ratings', methods=['POST'])
@login_required
def create_rating():
    user = get_current_user()
    data = request.get_json() or {}

    discogs_id = data.get('discogs_id')
    score      = data.get('score')
    review     = (data.get('review') or '').strip()

    if not discogs_id or score is None:
        return jsonify({'error': 'discogs_id and score are required.'}), 400
    if not (1 <= int(score) <= 5):
        return jsonify({'error': 'Score must be 1-5.'}), 400

    # Upsert album into local cache
    album = db.session.get(Album, int(discogs_id))
    if not album:
        album = Album(
            id=int(discogs_id),
            title=data.get('title', 'Unknown'),
            artist=data.get('artist', 'Unknown'),
            year=data.get('year', ''),
            thumb_url=data.get('thumb_url', ''),
        )
        db.session.add(album)

    existing = Rating.query.filter_by(user_id=user.id, album_id=int(discogs_id)).first()
    if existing:
        return jsonify({'error': 'Already rated.', 'rating': existing.to_dict()}), 409

    rating = Rating(
        user_id=user.id,
        album_id=int(discogs_id),
        score=int(score),
        review=review,
    )
    db.session.add(rating)
    db.session.commit()
    return jsonify(rating.to_dict()), 201


@app.route('/api/ratings/<int:rating_id>', methods=['PUT'])
@login_required
def update_rating(rating_id):
    user   = get_current_user()
    rating = db.session.get(Rating, rating_id)

    if not rating:
        return jsonify({'error': 'Rating not found.'}), 404
    if rating.user_id != user.id:
        return jsonify({'error': 'Forbidden.'}), 403

    data = request.get_json() or {}
    if 'score' in data:
        score = int(data['score'])
        if not (1 <= score <= 5):
            return jsonify({'error': 'Score must be 1-5.'}), 400
        rating.score = score
    if 'review' in data:
        rating.review = (data['review'] or '').strip()

    rating.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(rating.to_dict())


@app.route('/api/ratings/<int:rating_id>', methods=['DELETE'])
@login_required
def delete_rating(rating_id):
    user   = get_current_user()
    rating = db.session.get(Rating, rating_id)

    if not rating:
        return jsonify({'error': 'Rating not found.'}), 404
    if rating.user_id != user.id:
        return jsonify({'error': 'Forbidden.'}), 403

    db.session.delete(rating)
    db.session.commit()
    return jsonify({'message': 'Deleted.'})


# ── My ratings ────────────────────────────────────────────────────────────────

@app.route('/api/my-ratings', methods=['GET'])
@login_required
def my_ratings():
    user = get_current_user()
    ratings = (
        Rating.query
        .filter_by(user_id=user.id)
        .order_by(Rating.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in ratings])


# ── Global feed ───────────────────────────────────────────────────────────────

@app.route('/api/feed', methods=['GET'])
def feed():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    pag = (
        Rating.query
        .order_by(Rating.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return jsonify({
        'items': [r.to_dict() for r in pag.items],
        'total': pag.total,
        'page':  pag.page,
        'pages': pag.pages,
    })


# ── Album community stats ─────────────────────────────────────────────────────

@app.route('/api/albums/<int:discogs_id>', methods=['GET'])
def album_detail(discogs_id):
    album = db.session.get(Album, discogs_id)
    if not album:
        return jsonify({'error': 'Album not rated by anyone yet.'}), 404

    user        = get_current_user()
    user_rating = None
    if user:
        r = Rating.query.filter_by(user_id=user.id, album_id=discogs_id).first()
        if r:
            user_rating = {'score': r.score, 'review': r.review, 'id': r.id}

    recent = (
        Rating.query
        .filter_by(album_id=discogs_id)
        .order_by(Rating.created_at.desc())
        .limit(10)
        .all()
    )

    return jsonify({
        **album.to_dict(include_stats=True),
        'user_rating':    user_rating,
        'recent_ratings': [r.to_dict() for r in recent],
    })


# ── User profile ──────────────────────────────────────────────────────────────

@app.route('/api/users/<username>', methods=['GET'])
def user_profile(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    ratings = (
        Rating.query
        .filter_by(user_id=user.id)
        .order_by(Rating.created_at.desc())
        .all()
    )
    return jsonify({
        **user.to_dict(include_stats=True),
        'ratings': [r.to_dict() for r in ratings],
    })


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'Vinyl Vault Social API'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)

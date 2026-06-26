from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    ratings = db.relationship(
        'Rating', backref='user', lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_stats=False):
        d = {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat(),
        }
        if include_stats:
            ratings = self.ratings.all()
            d['total_ratings'] = len(ratings)
            d['avg_given'] = (
                round(sum(r.score for r in ratings) / len(ratings), 2)
                if ratings else None
            )
            d['masterpieces'] = sum(1 for r in ratings if r.score == 5)
        return d


class Album(db.Model):
    """
    Represents an album cached from Discogs.
    Primary key IS the Discogs release ID.
    """
    __tablename__ = 'albums'

    id = db.Column(db.Integer, primary_key=True)  # = discogs_id
    title = db.Column(db.String(300), nullable=False)
    artist = db.Column(db.String(300), nullable=False)
    year = db.Column(db.String(10), nullable=True)
    thumb_url = db.Column(db.String(500), nullable=True)

    ratings = db.relationship(
        'Rating', backref='album', lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def community_stats(self):
        """Return AVG score and total votes using SQL aggregation."""
        result = db.session.query(
            func.avg(Rating.score).label('avg'),
            func.count(Rating.id).label('count')
        ).filter(Rating.album_id == self.id).first()

        return {
            'avg_rating': round(float(result.avg), 2) if result.avg else None,
            'total_ratings': result.count or 0,
        }

    def to_dict(self, include_stats=False, user_rating=None):
        d = {
            'discogs_id': self.id,
            'title': self.title,
            'artist': self.artist,
            'year': self.year,
            'thumb_url': self.thumb_url,
        }
        if include_stats:
            d.update(self.community_stats())
        if user_rating is not None:
            d['user_rating'] = user_rating
        return d


class Rating(db.Model):
    __tablename__ = 'ratings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False, index=True
    )
    album_id = db.Column(
        db.Integer, db.ForeignKey('albums.id', ondelete='CASCADE'),
        nullable=False, index=True
    )
    score = db.Column(db.Integer, nullable=False)
    review = db.Column(db.Text, nullable=True, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # One rating per user per album
    __table_args__ = (
        db.UniqueConstraint('user_id', 'album_id', name='uq_user_album'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username,
            'album_id': self.album_id,
            'album_title': self.album.title,
            'album_artist': self.album.artist,
            'album_thumb': self.album.thumb_url,
            'album_year': self.album.year,
            'score': self.score,
            'review': self.review or '',
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

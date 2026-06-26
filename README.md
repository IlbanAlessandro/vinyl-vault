# Vinyl Vault – Social Platform for Vinyl Collectors

A collaborative web application designed for vinyl music enthusiasts to search for albums, rate them, and write reviews within a social feed. 

---

## 👥 The Team & Roles
This project was developed collaboratively in a team environment:
* **Alessandro Ilban** — **Database Architect & Developer**: Responsible for database design, ORM modeling, relationships, and data serialization.
* **colleague 1** — **Backend Developer**: Responsible for Flask API routes, JWT authentication, and Discogs API proxy integration.
* **colleague 2** — **Frontend Developer**: Responsible for the React UI, state management, and user experience.

---

## 🛠️ Technology Stack & Architecture (My Contribution)

As the **Database Developer**, I designed and engineered the storage layer using a **Code-First** approach.

* **Database Engine:** SQLite (`vinyl_vault.db`) — chosen for its lightweight, local serverless file structure.
* **ORM (Object-Relational Mapping):** SQLAlchemy & Flask-SQLAlchemy — used to abstract SQL queries into clean Python objects and natively prevent SQL Injection attacks.

### Key Database Implementations:
1. **Relational Schema:** Modeled three core entities (`User`, `Album`, `Rating`) forming a **Many-to-Many** relationship managed through a junction table (`ratings`).
2. **Data Integrity:** Enforced unique database-level constraints (`UniqueConstraint('user_id', 'album_id')`) to prevent duplicate voting, along with `ondelete='CASCADE'` for orphan data removal.
3. **Performance Optimization:** Utilized **Lazy Loading** (`lazy='dynamic'`) on relationships to minimize RAM overhead, alongside direct **SQL Aggregations** (`func.avg`, `func.count`) for instant community statistics computation.
4. **Security:** Managed secure password storage using cryptographic hashing via `werkzeug.security`.

---

## 🚀 How to Run the Backend Local Database

1. Navigate to the backend directory:
   ```bash
   cd backend

   pip install -r requirements.txt

   python app.py

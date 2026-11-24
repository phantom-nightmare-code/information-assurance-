# StockFlow

Inventory management app with a React frontend and Express/MongoDB backend.

## Setup

```bash
npm run install:all
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:5000>

The backend uses memory storage unless `MONGO_URI` is configured. For persistent MongoDB storage, create `backend/.env` with your own connection string:

```env
MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster-host>/stockflowDB?retryWrites=true&w=majority
```

Keep real credentials out of source control; `.env` files are ignored by Git.
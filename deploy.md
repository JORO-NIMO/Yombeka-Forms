# Deploying to Render

This guide provides step-by-step instructions for deploying the FormFlow application to Render.

## 1. Sign up for Render

First, create an account on [Render](https://render.com/). You can sign up with your GitHub account, which will make connecting your repository easier.

## 2. Create the PostgreSQL Database

From the Render dashboard:

1.  Click **New +** and select **PostgreSQL**.
2.  Give your database a unique name (e.g., `formflow-db`).
3.  Select a region close to you.
4.  Choose the **Free** plan.
5.  Click **Create Database**.

Once the database is created, go to its page, and under the "Connect" section, find the **Internal Database URL**. Copy this URL; you will need it for the backend's environment variables.

## 3. Deploy the Backend

From the Render dashboard:

1.  Click **New +** and select **Web Service**.
2.  Connect your GitHub repository.
3.  Give your service a name (e.g., `formflow-backend`).
4.  Set the **Root Directory** to `backend`.
5.  Set the **Build Command** to `npm install && npm run build`.
6.  Set the **Start Command** to `npm start`.
7.  Choose the **Free** plan.
8.  Under **Advanced**, add the following **Environment Variables**:
    *   `DATABASE_URL`: Paste the **Internal Database URL** you copied from your Render PostgreSQL database.
    *   `JWT_SECRET`: Enter a long, random string for signing tokens.
    *   `NODE_ENV`: Set this to `production`.

9.  Click **Create Web Service**.

Render will now build and deploy your backend. Once it's live, copy the URL of your backend service (it will look like `https://formflow-backend-xxxx.onrender.com`).

## 4. Deploy the Frontend

From the Render dashboard:

1.  Click **New +** and select **Static Site**.
2.  Connect the same GitHub repository.
3.  Give your site a name (e.g., `formflow-frontend`).
4.  Set the **Root Directory** to `frontend`.
5.  Set the **Build Command** to `npm install && npm run build`.
6.  Set the **Publish Directory** to `dist`.
7.  Under **Advanced**, add the following **Environment Variable**:
    *   `VITE_API_URL`: Paste the URL of your deployed backend service (e.g., `https://formflow-backend-xxxx.onrender.com`).

8.  Click **Create Static Site**.

Render will build and deploy your frontend.

## 5. Final Steps

Once both the backend and frontend are deployed, you should be able to access your application at the frontend URL.

### Running Migrations

The first time you deploy, the database will be empty. To run the Prisma migrations on the deployed database:

1.  Go to your backend service page on Render.
2.  Click on the **Shell** tab.
3.  Run the command: `npx prisma migrate deploy`

Your application should now be live and ready to use.

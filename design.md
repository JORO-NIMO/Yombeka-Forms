
# Design and Implementation

This document provides a detailed overview of the design and implementation of the FormFlow application.

## Backend

The backend is a Node.js application using Express.js as the web framework. It is written in TypeScript and uses Prisma as the ORM for database access.

### Database

The database is a PostgreSQL database. The schema is defined in `prisma/schema.prisma`.

The following models are defined:

*   `User`: Represents a user of the application.
*   `Form`: Represents a form created by a user.
*   `Field`: Represents a field in a form.
*   `Submission`: Represents a submission of a form.
*   `ExportJob`: Represents a job to export form submissions.

### API

The API is defined in `src/routes`. The following routes are defined:

*   `auth`: Handles user authentication.
*   `forms`: Handles form creation, submission, and management.

## Frontend

The frontend is a React application written in TypeScript. It uses Vite as the build tool.

### Pages

The following pages are defined:

*   `Login`: Handles user login.
*   `Builder`: Allows users to create and edit forms.
*   `Responses`: Allows users to view form submissions.
*   `PublicForm`: Displays a form for users to fill out.

### Components

The following components are defined:

*   `Form`: Renders a form.
*   `Field`: Renders a form field.
*   `Submission`: Renders a form submission.

## Deployment

The application is deployed as a set of Docker containers. The following containers are defined:

*   `backend`: The backend application.
*   `frontend`: The frontend application.
*   `postgres`: The PostgreSQL database.
*   `redis`: The Redis server.

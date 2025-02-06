# Vehicle Promotion Web Application

This project is a web application where you can view, add, edit, and delete vehicle 
brand, model, and technical information.

## Features

- Add, edit, and delete vehicles
- Upload vehicle images
- Responsive design
- PostgreSQL database
- Easy setup with Docker

## Requirements

- Docker
- Docker Compose

## Install

1. Clone the project:
```bash
git clone <repo-url>
cd <project-folder>
```

2. Start the Docker containers:
```bash
docker-compose up --build
```

3. Open the following address in your browser:
```
http://localhost:3000
```

## Technologies

- Node.js
- Express.js
- EJS Template Engine
- PostgreSQL
- Docker
- Bootstrap 5
- Font Awesome

## Directory Structure

```
.
├── app.js
├── docker-compose.yml
├── Dockerfile
├── package.json
├── public
│   ├── css
│   │   └── style.css
│   └── uploads
├── views
│   └── index.ejs
└── README.md
``` 
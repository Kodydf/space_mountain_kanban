# Kanban Project

## Business Requirements

- An MVP of a Kanban style Project Management application as a web app  
- The web app should only have 1 board
- The board has fixed 5 columns that can be renamed  
- Each card has a title and details only
- Drag and drop interface to move cards between columns
- Add a new card to a column; delete an existing card
- No more functionality: no archive, no search/filter. Keep it simple.
- The priority is a slick, professional, gorgeous UI/UX with very simple features
- The app should open with dummy data populated for the single board

## Frontend Details

- Implemented as a modern NextJS app
- The NextJS app should be created in a subdirectory `frontend`
- Use popular libraries
- As simple as possible but with an elegant UI

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Backend Details 
- A user can sign in
- When signed in a user sees a Kanban board that represents their project. 
- For the MVP there will only be a user sign in (hardcoded 'user' and 'password') but the database will support multiple users in the future. 
- For the MVP there will only be one Kanban board per user. 
- For the MVP this will run locally in a Docker Container.  
- Python FastAPI backend, including serving the static NextJS site at /
- Everything packaged into a Docker container
- Use "uv" as the package manager for python in the Docker Container
- Use SQLLite local database for the database, creating a new DB if it doesn't exist
- Start and Stop server scripts for PC, Mac, Linux in scripts/ 

## Starting State
A working MVP of the frontend has already been built and is already in frontend. This is not yet designed for Docker setup. It's a pure front-end only demo with dummy data. 

## Strategy

1. Write plan with success criteria for each phase to be checked off. Include project scaffolding, including .gitignore, and rigorous unit testing.
2. Execute the plan ensuring all critiera are met
3. Carry out extensive integration testing with Playwright or similar, fixing defects
4. Only complete when the MVP is finished and tested, with the server running and ready for the user

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever

# Guide

## Route Hierarchy

  With `hierarchical-router` routes are defined hierarchically. The resulting route hierarchy is used to determine the necessary parts that have to be executed to reflect changes between two user interactions. The business logic of a route is thereby separated into parts, where each part reflects the changes necessary to move from one route to an immediately following one.

  **Example:**

```js
var root     = swac.get('/')             // = /
var projects = root.get('/projects')     // = /projects
var project  = projects.get('/:project') // = /projects/:project
var tasks    = project.get('/tasks')     // = /projects/:project/tasks
```
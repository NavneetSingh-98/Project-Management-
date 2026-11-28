import express from "express"
import { addMember, createProject, searchProjects, updateProject } from "../controllers/projectController.js";


const projectRouter = express.Router();

projectRouter.post('/',createProject)
projectRouter.put('/',updateProject)
projectRouter.post('/:projectId/addMember',addMember)



// Register before any dynamic /:id route
router.get("/search", searchProjects);

export default projectRouter
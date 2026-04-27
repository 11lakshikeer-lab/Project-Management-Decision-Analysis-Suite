import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-2df582f7/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all projects
app.get("/make-server-2df582f7/projects", async (c) => {
  try {
    const projects = await kv.getByPrefix("project:");
    return c.json({ projects: projects || [] });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
});

// Get single project by ID
app.get("/make-server-2df582f7/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }
    
    return c.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return c.json({ error: "Failed to fetch project" }, 500);
  }
});

// Create or update a project
app.post("/make-server-2df582f7/projects", async (c) => {
  try {
    const projectData = await c.req.json();
    
    if (!projectData.id) {
      return c.json({ error: "Project ID is required" }, 400);
    }
    
    await kv.set(`project:${projectData.id}`, projectData);
    return c.json({ success: true, project: projectData });
  } catch (error) {
    console.error("Error saving project:", error);
    return c.json({ error: "Failed to save project" }, 500);
  }
});

// Update an existing project
app.put("/make-server-2df582f7/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const projectData = await c.req.json();
    
    // Check if project exists
    const existingProject = await kv.get(`project:${id}`);
    if (!existingProject) {
      return c.json({ error: "Project not found" }, 404);
    }
    
    // Update with new data
    const updatedProject = {
      ...projectData,
      id,
      lastModified: new Date().toISOString(),
    };
    
    await kv.set(`project:${id}`, updatedProject);
    return c.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
});

// Delete a project
app.delete("/make-server-2df582f7/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Check if project exists
    const existingProject = await kv.get(`project:${id}`);
    if (!existingProject) {
      return c.json({ error: "Project not found" }, 404);
    }
    
    await kv.del(`project:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return c.json({ error: "Failed to delete project" }, 500);
  }
});

Deno.serve(app.fetch);
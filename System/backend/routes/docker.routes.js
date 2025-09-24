import express from 'express';
import multer from 'multer';
import dockerController from '../controllers/docker.controller.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 100 // Max 100 files
    }
});

// Validation middleware
const validateProjectType = body('projectType')
    .optional()
    .isIn(['nextjs', 'react', 'vite-react', 'angular', 'nodejs'])
    .withMessage('Invalid project type');

const validateContainerId = param('containerId')
    .isUUID()
    .withMessage('Invalid container ID');

const validateTail = query('tail')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Tail must be between 1 and 1000');

// Routes

// POST /api/docker/run - Run a full-stack project
router.post('/run', 
    upload.array('files'),
    validateProjectType,
    dockerController.runProject
);

// POST /api/docker/run-from-tree - Run project directly from file tree
router.post('/run-from-tree',
    validateProjectType,
    dockerController.runProjectFromTree
);

// DELETE /api/docker/stop/:containerId - Stop a running project
router.delete('/stop/:containerId',
    validateContainerId,
    dockerController.stopProject
);

// GET /api/docker/status/:containerId - Get container status
router.get('/status/:containerId',
    validateContainerId,
    dockerController.getContainerStatus
);

// GET /api/docker/containers - Get all active containers
router.get('/containers',
    dockerController.getActiveContainers
);

// POST /api/docker/restart/:containerId - Restart a container
router.post('/restart/:containerId',
    validateContainerId,
    dockerController.restartContainer
);

// GET /api/docker/logs/:containerId - Get container logs
router.get('/logs/:containerId',
    validateContainerId,
    validateTail,
    dockerController.getContainerLogs
);

// PUT /api/docker/update/:containerId - Update project files and restart
router.put('/update/:containerId',
    upload.array('files'),
    validateContainerId,
    dockerController.updateProject
);

// PUT /api/docker/update-from-tree/:containerId - Update project from file tree and restart
router.put('/update-from-tree/:containerId',
    validateContainerId,
    dockerController.updateProjectFromTree
);

// GET /api/docker/project-types - Get supported project types
router.get('/project-types',
    dockerController.getSupportedProjectTypes
);

export default router; 
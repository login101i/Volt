import express from 'express';
import developmentIssuesController from '../controllers/developmentIssuesController.js';

const developmentIssuesRouter = express.Router();

console.log('🛠️  Setting up DevelopmentIssues routes...');

developmentIssuesRouter.get('/', developmentIssuesController.fetchDevelopmentIssues);
developmentIssuesRouter.post('/', developmentIssuesController.createDevelopmentIssue);
developmentIssuesRouter.patch('/', developmentIssuesController.updateDevelopmentIssue);
developmentIssuesRouter.delete('/:id', developmentIssuesController.deleteDevelopmentIssue);
developmentIssuesRouter.delete('/', developmentIssuesController.deleteDevelopmentIssue);

console.log(
  '✅ DevelopmentIssues routes: GET|POST|PATCH|DELETE /api/development-issues',
);

export default developmentIssuesRouter;

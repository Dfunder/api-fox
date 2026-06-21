const mongoose = require('mongoose');
const Project = require('../models/Project.model');

describe('Project model schema', () => {
  const ownerId = new mongoose.Types.ObjectId();

  it('saves with required fields and correct defaults', () => {
    const project = new Project({ title: 'Clean Water Fund', goalAmount: 5000, owner: ownerId });

    expect(project.title).toBe('Clean Water Fund');
    expect(project.goalAmount).toBe(5000);
    expect(project.raisedAmount).toBe(0);
    expect(project.currency).toBe('XLM');
    expect(project.status).toBe('draft');
    expect(project.documents).toEqual([]);
  });

  it('rejects invalid status enum', () => {
    const project = new Project({ title: 'Test', goalAmount: 100, owner: ownerId, status: 'unknown' });
    const err = project.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  it('requires title', () => {
    const project = new Project({ goalAmount: 100, owner: ownerId });
    const err = project.validateSync();
    expect(err.errors.title).toBeDefined();
  });

  it('requires owner', () => {
    const project = new Project({ title: 'Test', goalAmount: 100 });
    const err = project.validateSync();
    expect(err.errors.owner).toBeDefined();
  });

  it('requires goalAmount', () => {
    const project = new Project({ title: 'Test', owner: ownerId });
    const err = project.validateSync();
    expect(err.errors.goalAmount).toBeDefined();
  });

  it('accepts all status enum values', () => {
    for (const status of ['draft', 'pending', 'active', 'rejected', 'completed']) {
      const project = new Project({ title: 'T', goalAmount: 1, owner: ownerId, status });
      expect(project.validateSync()).toBeUndefined();
    }
  });

  it('accepts optional fields', () => {
    const project = new Project({
      title: 'Solar Initiative',
      goalAmount: 10000,
      owner: ownerId,
      category: 'Energy',
      currency: 'USDC',
      stellarAddress: 'GABC123',
      coverImage: 'https://example.com/cover.jpg',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      documents: [
        {
          originalName: 'plan.pdf',
          filename: 'plan-stored.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          url: '/uploads/plan-stored.pdf',
        },
      ],
    });

    expect(project.category).toBe('Energy');
    expect(project.currency).toBe('USDC');
    expect(project.stellarAddress).toBe('GABC123');
    expect(project.documents).toHaveLength(1);
    expect(project.documents[0].originalName).toBe('plan.pdf');
  });

  it('has indexes on status and owner', () => {
    const indexes = Project.schema.indexes();
    const keys = indexes.map(([fields]) => Object.keys(fields).join(','));
    expect(keys).toContain('status');
    expect(keys).toContain('owner');
  });
});

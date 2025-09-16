const { validationResult } = require('express-validator');
const pool = require('../config/database');

// Create new job posting
const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      companyId,
      title,
      description,
      requirements,
      skillsRequired,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency = 'USD'
    } = req.body;

    const result = await pool.query(
      `INSERT INTO job_postings 
       (company_id, title, description, requirements, skills_required, location, 
        job_type, experience_level, salary_min, salary_max, currency, posted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        companyId, title, description, requirements, skillsRequired, location,
        jobType, experienceLevel, salaryMin, salaryMax, currency, req.user.id
      ]
    );

    const job = result.rows[0];
    res.status(201).json({
      message: 'Job posting created successfully',
      job: {
        id: job.id,
        companyId: job.company_id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skillsRequired: job.skills_required,
        location: job.location,
        jobType: job.job_type,
        experienceLevel: job.experience_level,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        currency: job.currency,
        isActive: job.is_active,
        createdAt: job.created_at
      }
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all job postings with search and filters
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      location = '',
      jobType = '',
      experienceLevel = '',
      salaryMin = '',
      salaryMax = '',
      companyId = ''
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT j.*, c.name as company_name, c.logo_url as company_logo
      FROM job_postings j
      JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = true
    `;
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (j.title ILIKE $${paramCount} OR j.description ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (location) {
      paramCount++;
      query += ` AND j.location ILIKE $${paramCount}`;
      queryParams.push(`%${location}%`);
    }

    if (jobType) {
      paramCount++;
      query += ` AND j.job_type = $${paramCount}`;
      queryParams.push(jobType);
    }

    if (experienceLevel) {
      paramCount++;
      query += ` AND j.experience_level = $${paramCount}`;
      queryParams.push(experienceLevel);
    }

    if (salaryMin) {
      paramCount++;
      query += ` AND j.salary_min >= $${paramCount}`;
      queryParams.push(salaryMin);
    }

    if (salaryMax) {
      paramCount++;
      query += ` AND j.salary_max <= $${paramCount}`;
      queryParams.push(salaryMax);
    }

    if (companyId) {
      paramCount++;
      query += ` AND j.company_id = $${paramCount}`;
      queryParams.push(companyId);
    }

    query += ` ORDER BY j.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM job_postings j
      JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = true
    `;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (j.title ILIKE $${countParamCount} OR j.description ILIKE $${countParamCount} OR c.name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (location) {
      countParamCount++;
      countQuery += ` AND j.location ILIKE $${countParamCount}`;
      countParams.push(`%${location}%`);
    }

    if (jobType) {
      countParamCount++;
      countQuery += ` AND j.job_type = $${countParamCount}`;
      countParams.push(jobType);
    }

    if (experienceLevel) {
      countParamCount++;
      countQuery += ` AND j.experience_level = $${countParamCount}`;
      countParams.push(experienceLevel);
    }

    if (salaryMin) {
      countParamCount++;
      countQuery += ` AND j.salary_min >= $${countParamCount}`;
      countParams.push(salaryMin);
    }

    if (salaryMax) {
      countParamCount++;
      countQuery += ` AND j.salary_max <= $${countParamCount}`;
      countParams.push(salaryMax);
    }

    if (companyId) {
      countParamCount++;
      countQuery += ` AND j.company_id = $${countParamCount}`;
      countParams.push(companyId);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      jobs: result.rows.map(job => ({
        id: job.id,
        companyId: job.company_id,
        companyName: job.company_name,
        companyLogo: job.company_logo,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skillsRequired: job.skills_required,
        location: job.location,
        jobType: job.job_type,
        experienceLevel: job.experience_level,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        currency: job.currency,
        createdAt: job.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT j.*, c.name as company_name, c.description as company_description,
              c.website as company_website, c.logo_url as company_logo,
              c.industry as company_industry, c.size as company_size
       FROM job_postings j
       JOIN companies c ON j.company_id = c.id
       WHERE j.id = $1 AND j.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];
    res.json({
      job: {
        id: job.id,
        companyId: job.company_id,
        companyName: job.company_name,
        companyDescription: job.company_description,
        companyWebsite: job.company_website,
        companyLogo: job.company_logo,
        companyIndustry: job.company_industry,
        companySize: job.company_size,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skillsRequired: job.skills_required,
        location: job.location,
        jobType: job.job_type,
        experienceLevel: job.experience_level,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        currency: job.currency,
        createdAt: job.created_at
      }
    });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply to job
const applyToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverLetter } = req.body;

    // Check if job exists
    const jobResult = await pool.query(
      'SELECT id FROM job_postings WHERE id = $1 AND is_active = true',
      [id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = await pool.query(
      'SELECT id FROM job_applications WHERE user_id = $1 AND job_posting_id = $2',
      [req.user.id, id]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    // Create application
    await pool.query(
      'INSERT INTO job_applications (user_id, job_posting_id, cover_letter) VALUES ($1, $2, $3)',
      [req.user.id, id, coverLetter || '']
    );

    res.json({ message: 'Application submitted successfully!' });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update job posting (admin only)
const updateJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      title,
      description,
      requirements,
      skillsRequired,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency,
      isActive
    } = req.body;

    // Get old values for audit log
    const oldResult = await pool.query('SELECT * FROM job_postings WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    req.oldValues = oldResult.rows[0];

    const result = await pool.query(
      `UPDATE job_postings SET 
       title = $1, description = $2, requirements = $3, skills_required = $4,
       location = $5, job_type = $6, experience_level = $7, salary_min = $8,
       salary_max = $9, currency = $10, is_active = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        title, description, requirements, skillsRequired, location,
        jobType, experienceLevel, salaryMin, salaryMax, currency,
        isActive, id
      ]
    );

    const job = result.rows[0];
    res.json({
      message: 'Job updated successfully',
      job: {
        id: job.id,
        companyId: job.company_id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skillsRequired: job.skills_required,
        location: job.location,
        jobType: job.job_type,
        experienceLevel: job.experience_level,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        currency: job.currency,
        isActive: job.is_active,
        updatedAt: job.updated_at
      }
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete job posting (admin only)
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Get old values for audit log
    const oldResult = await pool.query('SELECT * FROM job_postings WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    req.oldValues = oldResult.rows[0];

    await pool.query('DELETE FROM job_postings WHERE id = $1', [id]);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  applyToJob,
  updateJob,
  deleteJob
};

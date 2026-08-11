import { body, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(422).json({
        errors: extractedErrors,
    });
};

/**
 * Validation rules for confirmUpload
 */
export const confirmUploadValidator = [
    body('students').isArray().withMessage('Students must be an array'),
    body('students.*.name').notEmpty().withMessage('Student name is required'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
    body('subjectName').optional().isString(),
    body('autoCreate').optional().isBoolean(),
    body('grade').optional().isString(),
    body('department').optional().isString(),
    body('section').optional().isString(),
    validate
];

/**
 * Validation rules for createTeacher
 */
export const createTeacherValidator = [
    body('name').notEmpty().withMessage('Teacher name is required').trim(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('subjects').optional().isArray().withMessage('Subjects must be an array'),
    validate
];

/**
 * Validation rules for updateStudent
 */
export const updateStudentValidator = [
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('username').optional().notEmpty().withMessage('Username cannot be empty').trim(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('grade').optional().isString(),
    body('department').optional().isString(),
    body('section').optional().isString(),
    body('average').optional().isNumeric().withMessage('Average must be a number'),
    body('total').optional().isNumeric().withMessage('Total must be a number'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
    validate
];

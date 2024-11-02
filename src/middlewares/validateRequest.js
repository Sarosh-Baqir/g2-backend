const { ZodError } = require("zod");

const validateRequest =
  (schema, type = "body") =>
  (req, res, next) => {
    try {
      schema.parse(req[type]); // Validate based on type (body or query)
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        }));
        return res.status(400).json({ errors: formattedErrors });
      }
      next(error);
    }
  };

module.exports = validateRequest;

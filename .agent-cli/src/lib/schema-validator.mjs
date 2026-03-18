function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTypeLabel(value) {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (Number.isInteger(value)) {
    return "integer";
  }

  return typeof value;
}

function matchesType(expectedType, value) {
  if (expectedType === "object") {
    return isPlainObject(value);
  }

  if (expectedType === "array") {
    return Array.isArray(value);
  }

  if (expectedType === "integer") {
    return Number.isInteger(value);
  }

  if (expectedType === "null") {
    return value === null;
  }

  return typeof value === expectedType;
}

function validateNode(schema, value, path, errors) {
  if (!schema || typeof schema !== "object") {
    return;
  }

  if (Array.isArray(schema.allOf)) {
    for (const branch of schema.allOf) {
      validateNode(branch, value, path, errors);
    }
  }

  if (schema.if && typeof schema.if === "object") {
    const branchErrors = [];
    validateNode(schema.if, value, path, branchErrors);

    if (branchErrors.length === 0) {
      if (schema.then && typeof schema.then === "object") {
        validateNode(schema.then, value, path, errors);
      }
    } else if (schema.else && typeof schema.else === "object") {
      validateNode(schema.else, value, path, errors);
    }
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of ${schema.enum.map((entry) => JSON.stringify(entry)).join(", ")}`);
  }

  if (schema.type) {
    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const typeMatches = expectedTypes.some((expectedType) => matchesType(expectedType, value));

    if (!typeMatches) {
      errors.push(`${path} must be ${expectedTypes.join(" or ")}, got ${getTypeLabel(value)}`);
      return;
    }
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path} must be at least ${schema.minLength} character(s)`);
    }

    if (schema.pattern) {
      const pattern = new RegExp(schema.pattern);
      if (!pattern.test(value)) {
        errors.push(`${path} must match ${schema.pattern}`);
      }
    }

    if (schema.format === "date-time" && Number.isNaN(Date.parse(value))) {
      errors.push(`${path} must be a valid date-time string`);
    }
  }

  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${path} must be >= ${schema.minimum}`);
  }

  if (Array.isArray(value)) {
    if (schema.uniqueItems) {
      const seen = new Set();

      value.forEach((entry, index) => {
        const signature = JSON.stringify(entry);
        if (seen.has(signature)) {
          errors.push(`${path}[${index}] must be unique`);
        }
        seen.add(signature);
      });
    }

    if (schema.items) {
      value.forEach((entry, index) => {
        validateNode(schema.items, entry, `${path}[${index}]`, errors);
      });
    }
    return;
  }

  if (isPlainObject(value)) {
    const properties = schema.properties || {};
    const required = schema.required || [];

    for (const key of required) {
      if (!(key in value)) {
        errors.push(`${path}.${key} is required`);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          errors.push(`${path}.${key} is not allowed`);
        }
      }
    }

    for (const [key, propertySchema] of Object.entries(properties)) {
      if (key in value) {
        validateNode(propertySchema, value[key], `${path}.${key}`, errors);
      }
    }
  }
}

export function validateAgainstSchema(schema, value, rootLabel = "value") {
  const errors = [];
  validateNode(schema, value, rootLabel, errors);
  return errors;
}

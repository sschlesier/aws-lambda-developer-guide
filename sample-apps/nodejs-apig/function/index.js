const AWS = require("aws-sdk");
const { SpanStatusCode, trace } = require("@opentelemetry/api");

// Create client outside of handler to reuse
const lambda = new AWS.Lambda();
const tracer = trace.getTracer("lambda-trial", "0.1.0");

// Handler
exports.handler = async function (event, context) {
  console.log("## ENVIRONMENT VARIABLES: " + serialize(process.env));
  console.log("## CONTEXT: " + serialize(context));
  console.log("## EVENT: " + serialize(event));
  const span = tracer.startSpan("getAccountSettings").setAttribute("data", 123);
  try {
    let accountSettings = await getAccountSettings();
    return formatResponse(serialize(accountSettings.AccountUsage));
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    return formatError(error);
  } finally {
    span.end();
  }
};

var formatResponse = function (body) {
  var response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    isBase64Encoded: false,
    multiValueHeaders: {
      "X-Custom-Header": ["My value", "My other value"],
    },
    body: body,
  };
  return response;
};

var formatError = function (error) {
  var response = {
    statusCode: error.statusCode,
    headers: {
      "Content-Type": "text/plain",
      "x-amzn-ErrorType": error.code,
    },
    isBase64Encoded: false,
    body: error.code + ": " + error.message,
  };
  return response;
};
// Use SDK client
var getAccountSettings = function () {
  return lambda.getAccountSettings().promise();
};

var serialize = function (object) {
  return JSON.stringify(object, null, 2);
};

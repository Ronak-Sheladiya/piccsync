// AWS Elastic Beanstalk entry point
// Set port for AWS EB
process.env.PORT = process.env.PORT || 8080;
require('./src/index.js');
const environments = {};

environments.staging = {
	httpPort: 3000,
	httpsPort: 3001,
	envName: 'staging',
	hashSecret: 'SomeSecret',
	currency: 'eur',
};

environments.production = {
	httpPort: 5000,
	httpsPort: 5001,
	envName: 'production',
	hashSecret: 'SomeSecretHash',
	currency: 'eur',
};

const currentEnvironment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const environmentToExport = typeof (environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;

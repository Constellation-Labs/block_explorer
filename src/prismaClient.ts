
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { PrismaClient } = require('@prisma/client');

const client = new SecretsManagerClient({
region: process.env.REGION,
});

async function getSecret(secret_name) {
  
    try {    
        const response = await client.send(
        new GetSecretValueCommand({
            SecretId: secret_name,
            VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
            })
        );

        return response.SecretString;
    } catch (error) {
        console.error("Error fetching secret, falling back to environment variables:", error);
        return {
            username: process.env.USERNAME || "user",
            password: process.env.PASSWORD || "password",
        };
    }
}
let prismaPromise = (async () => {

    const { username, password } = await getSecret(process.env.SECRET_ID);

    let dbUrl = process.env.DATABASE_URL || "";

    dbUrl = dbUrl.replace('USERNAME', username);
    dbUrl = dbUrl.replace('PASSWORD', password);

    return new PrismaClient({
        datasources: {
            db: {
                url: dbUrl
            }
        }
    //   log: ['query', 'info', 'warn', 'error'],
    });
  }
)


export async function getPrisma() {
    return prismaPromise();
}
    


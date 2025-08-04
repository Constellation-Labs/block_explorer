
import { seed } from "../prisma/seed";
module.exports = async function (globalConfig, projectConfig) { 
    await seed();
};
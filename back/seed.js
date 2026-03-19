require("dotenv").config();

const seedAdmin = require("./src/config/seedAdmin");

const runSeed = async () => {
    try {
        await seedAdmin();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runSeed();
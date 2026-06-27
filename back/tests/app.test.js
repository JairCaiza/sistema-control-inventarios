const request = require("supertest");
const app = require("../src/app");

describe("Pruebas básicas del backend", () => {
    test("GET /health debe responder estado ok", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("ok");
        expect(response.body.service).toBe("backend");
    });

    test("POST /api/auth/login sin contraseña debe responder 400", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                correo: "admin@sistema.com",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("message");
    });
});
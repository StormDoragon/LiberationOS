process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "file::memory:?cache=shared";

// PostgreSQL and Redis integration suites can use Testcontainers when those services are exercised end to end.

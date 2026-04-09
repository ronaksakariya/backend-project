import "dotenv/config";
import connectDatabase from "./database/index.js";
import app from "./app.js";

connectDatabase()
  .then(() => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log("server is running at", port);
    });
  })
  .catch((error) => {
    console.log("mongodb connection error", error);
  });

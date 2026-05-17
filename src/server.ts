process.env.TZ = "Asia/Seoul";
import { app } from "./app";

const port = process.env.PORT || 3000;

app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`),
);

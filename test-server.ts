import { Raven } from "./packages/main/index.ts";

const app = new Raven();

// 启动服务器
app.listen({ port: 3000, hostname: "localhost" });

console.log("Raven server started on http://localhost:3000");
console.log("Press Ctrl+C to stop the server");

// 处理退出信号
process.on("SIGINT", () => {
	console.log("\nStopping server...");
	app.stop();
	process.exit(0);
});

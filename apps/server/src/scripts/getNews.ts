export default async function getNews() {
  console.log("Cron job iniciado em:", new Date().toISOString());

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Cron job finalizado em:", new Date().toISOString());
  } catch (err) {
    console.error("Erro no cron job:", err);
  }
}

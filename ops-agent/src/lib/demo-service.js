const BASE_URL = process.env.DEMO_SERVICE_URL || "http://localhost:3000";

export async function callDemoService(path) {
  const started = Date.now();
  try {
    //const url = `${BASE_URL}${path}`;
    const response = await fetch(BASE_URL + path, {
        signal: AbortSignal.timeout(3000), // Set a timeout of 3 seconds
    });

    const body = await response.json();
   console.log("Demo service response:", body);
   
    return {httpStatus: response.status, ms: Date.now() - started, body };
  } catch (error) {
    return {
      error: `${error.name}: ${error.message}`,
      ms: Date.now() - started,
    };
  }
}
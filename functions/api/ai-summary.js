export async function onRequestPost(context) {
  try {
    // Protect this endpoint with the same Team Code as Team Pulse
    const providedCode = context.request.headers.get("X-Team-Code");

    if (
      !context.env.TEAM_CODE ||
      !providedCode ||
      providedCode !== context.env.TEAM_CODE
    ) {
      return Response.json(
        {
          success: false,
          error: "Team Code required."
        },
        { status: 401 }
      );
    }

    // Test Workers AI
    const result = await context.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct-fast",
      {
        messages: [
          {
            role: "system",
            content:
              "You write concise, professional workplace summaries in natural English."
          },
          {
            role: "user",
            content:
              "Write one short sentence summarising a productive year of teamwork, weekly priorities and achievements."
          }
        ],
        max_tokens: 80
      }
    );

    return Response.json({
      success: true,
      summary: result.response || ""
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message || "AI request failed."
      },
      { status: 500 }
    );
  }
}

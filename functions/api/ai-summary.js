const ALLOWED_PEOPLE = ["Megan", "Penny", "Nikki"];

export async function onRequestPost(context) {
  try {
    // Protect with the same Team Code as Team Pulse
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

    // Read requested person.
    // "Team" means everyone.
    let person = "Team";

    try {
      const body = await context.request.json();

      if (body?.person) {
        person = body.person;
      }
    } catch {
      // No request body is fine — default to Team
    }

    if (person !== "Team" && !ALLOWED_PEOPLE.includes(person)) {
      return Response.json(
        {
          success: false,
          error: "Invalid person."
        },
        { status: 400 }
      );
    }

    // Current calendar year
    const year = new Date().getUTCFullYear();
    const yearStart = `${year}-01-01`;
    const nextYearStart = `${year + 1}-01-01`;

    // Read this year's real Focus + Wins from D1
    let query = `
      SELECT week_start, person, type, text
      FROM weekly_updates
      WHERE week_start >= ?
        AND week_start < ?
    `;

    const params = [yearStart, nextYearStart];

    if (person !== "Team") {
      query += ` AND person = ?`;
      params.push(person);
    }

    query += ` ORDER BY week_start ASC, person ASC`;

    const { results } = await context.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    if (!results || results.length === 0) {
      return Response.json(
        {
          success: false,
          error: `No ${year} updates found for ${person}.`
        },
        { status: 400 }
      );
    }

    // Prepare the real Team Pulse records for AI
    const records = results
      .map(row => {
        const label = row.type === "focus" ? "Focus" : "Win";

        return `${row.week_start} | ${row.person} | ${label}: ${row.text}`;
      })
      .join("\n");

    const subject =
      person === "Team"
        ? "the team"
        : person;

    // Generate one sentence from the real records
    const result = await context.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct-fast",
      {
        messages: [
          {
            role: "system",
            content:
              "You summarise workplace achievements accurately and naturally. Use only the information provided. Do not invent achievements, numbers or outcomes. Return exactly one concise English sentence, around 20 to 35 words, with no heading, bullet point or quotation marks."
          },
          {
            role: "user",
            content:
              `Using the Team Pulse records below, write one sentence that captures what defined ${subject}'s ${year} so far. Give slightly more emphasis to wins and achievements than routine weekly tasks.\n\n${records}`
          }
        ],
        max_tokens: 100
      }
    );

    const summary = (result.response || "").trim();

    if (!summary) {
      throw new Error("AI returned an empty summary.");
    }

    return Response.json({
      success: true,
      year,
      person,
      recordsUsed: results.length,
      summary
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message || "AI summary failed."
      },
      { status: 500 }
    );
  }
}

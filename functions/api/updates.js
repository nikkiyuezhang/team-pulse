export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB
      .prepare(`
        SELECT
          id,
          week_start,
          person,
          type,
          text,
          created_at,
          updated_at
        FROM weekly_updates
        ORDER BY created_at ASC
      `)
      .all();

    return Response.json({
      success: true,
      updates: results
    });

  } catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}


export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const weekStart = body.week_start;
    const person = body.person;
    const type = body.type;
    const text = body.text?.trim();

    const allowedPeople = [
      "Nikki",
      "Penny",
      "Megan"
    ];

    const allowedTypes = [
      "focus",
      "win"
    ];

    if (
      !weekStart ||
      !allowedPeople.includes(person) ||
      !allowedTypes.includes(type) ||
      !text
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid update"
        },
        { status: 400 }
      );
    }

    const result = await env.DB
      .prepare(`
        INSERT INTO weekly_updates
          (week_start, person, type, text)
        VALUES (?, ?, ?, ?)
      `)
      .bind(
        weekStart,
        person,
        type,
        text
      )
      .run();

    return Response.json({
      success: true,
      id: result.meta.last_row_id
    });

  } catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

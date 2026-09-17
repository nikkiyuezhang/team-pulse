const ALLOWED_PEOPLE = ["Megan", "Penny", "Nikki"];

function isAuthorized(request, env) {
  const providedCode = request.headers.get("X-Team-Code");

  return (
    env.TEAM_CODE &&
    providedCode &&
    providedCode === env.TEAM_CODE
  );
}

function unauthorizedResponse() {
  return Response.json(
    {
      success: false,
      error: "Team Code required."
    },
    { status: 401 }
  );
}


/* GET — LOAD ANNOUNCEMENTS */

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const { results } = await env.DB
      .prepare(`
        SELECT
          id,
          person,
          text,
          expires_at,
          created_at,
          updated_at
        FROM announcements
        ORDER BY created_at DESC
      `)
      .all();

    return Response.json({
      success: true,
      announcements: results || []
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


/* POST — ADD ANNOUNCEMENT */

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();

    const person = body.person?.trim();
    const text = body.text?.trim();
    const expiresAt = body.expires_at || null;

    if (!ALLOWED_PEOPLE.includes(person)) {
      return Response.json(
        {
          success: false,
          error: "Please select a valid team member."
        },
        { status: 400 }
      );
    }

    if (!text) {
      return Response.json(
        {
          success: false,
          error: "Announcement cannot be empty."
        },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return Response.json(
        {
          success: false,
          error: "Announcement is too long."
        },
        { status: 400 }
      );
    }

    const result = await env.DB
      .prepare(`
        INSERT INTO announcements
          (person, text, expires_at)
        VALUES
          (?, ?, ?)
      `)
      .bind(person, text, expiresAt)
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


/* PATCH — EDIT ANNOUNCEMENT */

export async function onRequestPatch(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();

    const id = Number(body.id);
    const person = body.person?.trim();
    const text = body.text?.trim();
    const expiresAt = body.expires_at || null;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Announcement ID is required."
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_PEOPLE.includes(person)) {
      return Response.json(
        {
          success: false,
          error: "Please select a valid team member."
        },
        { status: 400 }
      );
    }

    if (!text) {
      return Response.json(
        {
          success: false,
          error: "Announcement cannot be empty."
        },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return Response.json(
        {
          success: false,
          error: "Announcement is too long."
        },
        { status: 400 }
      );
    }

    await env.DB
      .prepare(`
        UPDATE announcements
        SET
          person = ?,
          text = ?,
          expires_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        person,
        text,
        expiresAt,
        id
      )
      .run();

    return Response.json({
      success: true
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


/* DELETE — REMOVE ANNOUNCEMENT */

export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Announcement ID is required."
        },
        { status: 400 }
      );
    }

    await env.DB
      .prepare(`
        DELETE FROM announcements
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return Response.json({
      success: true
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

/*
  TEAM PULSE API
  --------------------------------
  GET    = Read updates
  POST   = Add update
  PATCH  = Edit update
  DELETE = Delete update
*/


const ALLOWED_PEOPLE = [
  "Nikki",
  "Penny",
  "Megan"
];

const ALLOWED_TYPES = [
  "focus",
  "win"
];


/*
  ================================
  GET
  Load all updates
  ================================
*/

export async function onRequestGet(context) {

  const { env } = context;

  try {

    const { results } =
      await env.DB
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

  }

  catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );

  }

}



/*
  ================================
  POST
  Add Focus or Win
  ================================
*/

export async function onRequestPost(context) {

  const {
    request,
    env
  } = context;


  try {

    const body =
      await request.json();


    const weekStart =
      body.week_start;

    const person =
      body.person;

    const type =
      body.type;

    const text =
      body.text?.trim();


    /*
      Validate input
    */

    if (
      !weekStart ||
      !ALLOWED_PEOPLE.includes(person) ||
      !ALLOWED_TYPES.includes(type) ||
      !text
    ) {

      return Response.json(
        {
          success: false,
          error: "Invalid update."
        },
        {
          status: 400
        }
      );

    }


    /*
      Save to D1
    */

    const result =
      await env.DB
        .prepare(`
          INSERT INTO weekly_updates
            (
              week_start,
              person,
              type,
              text
            )
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

  }

  catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );

  }

}



/*
  ================================
  PATCH
  Edit an existing update
  ================================
*/

export async function onRequestPatch(context) {

  const {
    request,
    env
  } = context;


  try {

    const body =
      await request.json();


    const id =
      Number(body.id);

    const person =
      body.person;

    const type =
      body.type;

    const text =
      body.text?.trim();


    /*
      Validate input
    */

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !ALLOWED_PEOPLE.includes(person) ||
      !ALLOWED_TYPES.includes(type) ||
      !text
    ) {

      return Response.json(
        {
          success: false,
          error: "Invalid update."
        },
        {
          status: 400
        }
      );

    }


    /*
      Update the record.

      person + type are also checked
      so we do not accidentally edit
      the wrong person's record.
    */

    const result =
      await env.DB
        .prepare(`
          UPDATE weekly_updates

          SET
            text = ?,
            updated_at = CURRENT_TIMESTAMP

          WHERE
            id = ?
            AND person = ?
            AND type = ?
        `)
        .bind(
          text,
          id,
          person,
          type
        )
        .run();


    if (
      result.meta.changes === 0
    ) {

      return Response.json(
        {
          success: false,
          error: "Update not found."
        },
        {
          status: 404
        }
      );

    }


    return Response.json({
      success: true
    });

  }

  catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );

  }

}



/*
  ================================
  DELETE
  Delete an existing update
  ================================
*/

export async function onRequestDelete(context) {

  const {
    request,
    env
  } = context;


  try {

    const body =
      await request.json();


    const id =
      Number(body.id);

    const person =
      body.person;

    const type =
      body.type;


    /*
      Validate input
    */

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !ALLOWED_PEOPLE.includes(person) ||
      !ALLOWED_TYPES.includes(type)
    ) {

      return Response.json(
        {
          success: false,
          error: "Invalid delete request."
        },
        {
          status: 400
        }
      );

    }


    /*
      Delete from D1
    */

    const result =
      await env.DB
        .prepare(`
          DELETE FROM weekly_updates

          WHERE
            id = ?
            AND person = ?
            AND type = ?
        `)
        .bind(
          id,
          person,
          type
        )
        .run();


    if (
      result.meta.changes === 0
    ) {

      return Response.json(
        {
          success: false,
          error: "Update not found."
        },
        {
          status: 404
        }
      );

    }


    return Response.json({
      success: true
    });

  }

  catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );

  }

}

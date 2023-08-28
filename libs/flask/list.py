from json import loads as json_loads
from html import escape as html_escape

from flask import jsonify

from libs import db as dbm

# creation details
MANDATORY_FIELDS = ['user_id', 'name']
OPTIONAL_FIELDS = ['comments', 'body', 'public']
ESCAPE_FIELDS = ['name', 'comments']
JSON_FIELDS = ['body']

# update details
USER_EDITABLE_FIELDS = ['name', 'comments', 'body', 'public']
SYSTEM_EDITABLE_FIELDS = ['user_id']

# get details
ORDER_FIELDS = ['name', 'updated_at', 'created_at']


def get_list(list_id, user_id=None, internal=False):
    where_values = [list_id]

    if user_id is None:
        wherestring = "AND public = TRUE"
    else:
        wherestring = "AND (public = TRUE OR user_id = %s)"
        where_values.append(user_id)
    query = f"""
    SELECT  id
           ,user_id
           ,name
           ,comments
           ,body
           ,public
           ,DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS created_at
           ,DATE_FORMAT(updated_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS updated_at
      FROM lists AS us
     WHERE id = %s
       {wherestring}
    ;
    """

    db = dbm.DbManager()
    existing_lists = db.fetch(query, where_values)

    if len(existing_lists) != 1:
        return jsonify({"success": False, "message": 'invalid list_id'}), 403

    result = existing_lists[0]
    result['body'] = json_loads(result['body'])

    if internal == True:
        return result

    return jsonify({"success": True, 'data': result})


def list_lists(user_id, public=True, order='updated_at'):
    if public is True:
        wherestring = "AND public = TRUE"
    else:
        wherestring = ""

    if order not in ORDER_FIELDS:
        jsonify({"success": False, "message": 'invalid order field'}), 400

    query = f"""
    SELECT  id
           ,user_id
           ,name
           ,comments
           ,body
           ,public
           ,DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS created_at
           ,DATE_FORMAT(updated_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS updated_at
      FROM lists AS us
     WHERE user_id = %s
       {wherestring}
     ORDER BY {order}
    ;
    """
    # print(query)

    db = dbm.DbManager()
    existing_lists = db.fetch(query, (user_id,))

    if len(existing_lists) < 1:
        return jsonify({"success": True, 'data': []}), 200

    result = []
    for e in existing_lists:
        e['body'] = json_loads(e['body'])
        result.append(e)

    return jsonify({"success": True, 'data': result})


def delete_list(list_id, user_id=None):
    where_values = [list_id]

    if user_id is not None:
        wherestring = "AND user_id = %s"
        where_values.append(user_id)

    query = f"""
    DELETE
      FROM lists
     WHERE id = %s
       {wherestring}
    ;
    """

    db = dbm.DbManager()
    try:
        _ = db.execute(query, where_values)
    except Exception:
        return jsonify({"success": False, "message": 'failed to delete list'}), 500

    return jsonify({"success": True, 'data': 'deleted list'})


def update_list(list_id, user_id, data):
    fields = []
    values = []
    wherestring = ""

    for k in USER_EDITABLE_FIELDS:
        if k in data:
            if k in JSON_FIELDS:
                try:
                    _ = json_loads(data[k])
                except Exception as e:
                    return jsonify({"success": False, "message": f"invalid JSON in field {k}"}), 400
            if k in ESCAPE_FIELDS:
                data[k] = html_escape(data[k])

            fields.append(k)
            values.append(data[k])

    if user_id is None:
        for k in SYSTEM_EDITABLE_FIELDS:
            if k in data:
                fields.append(k)
                values.append(data[k])

    if len(values) == 0:
        return jsonify({"success": False, "message": "no valid fields to update"}), 400

    values.append(list_id)
    wherestring = ""
    if user_id is not None:
        wherestring = " AND user_id = %s"
        values.append(user_id)

    fields = ', '.join([f"{k} = %s" for k in fields])
    query = """
    UPDATE lists
       SET updated_at = CURRENT_TIMESTAMP,
           {fields}
     WHERE id = %s
       {wherestring}
    ;
    """.format(fields=fields,
               wherestring=wherestring)

    db = dbm.DbManager()
    try:
        _ = db.execute(query, values)
    except Exception as e:
        return jsonify({"success": False, "message": f"failed to update list: ({type(e)}) {str(e)}"}), 500

    list_data = get_list(list_id, user_id, internal=True)
    if not isinstance(list_data, dict):
        return list_data

    return jsonify({"success": True, 'data': list_data})


def create_list(**kwargs):
    for k in MANDATORY_FIELDS:
        if k not in kwargs:
            return jsonify({"success": False, "message": f"missing mandatory field '{k}'"}), 400
    keys = [k for k in MANDATORY_FIELDS]
    values = []
    for k in MANDATORY_FIELDS:
        kvalue = kwargs.get(k)
        if k in JSON_FIELDS:
            try:
                _ = json_loads(kvalue)
            except Exception as e:
                return jsonify({"success": False, "message": f"invalid JSON in field {k}"}), 400
        if k in ESCAPE_FIELDS:
            kvalue = html_escape(kvalue)
        values.append(kvalue)

    for k in OPTIONAL_FIELDS:
        if k not in kwargs:
            continue

        kvalue = kwargs.get(k)
        if k in JSON_FIELDS:
            try:
                _ = json_loads(kvalue)
            except Exception as e:
                return jsonify({"success": False, "message": f"invalid JSON in field {k}"}), 400
        if k in ESCAPE_FIELDS:
            kvalue = html_escape(kvalue)
        keys.append(k)
        values.append(kvalue)

    placeholders = ', '.join(['%s' for i in range(len(keys))])
    keys = ', '.join(keys)

    query = """
    INSERT INTO lists
                ({keys})
         VALUES ({placeholders});
    """.format(keys=keys,
               placeholders=placeholders)
    try:
        db = dbm.DbManager()
        list_id = db.execute(query, values)
    except Exception as e:
        return jsonify({"success": False, "message": f"failed to create list: ({type(e)}) {str(e)}"}), 500

    list_data = get_list(list_id, kwargs.get('user_id'), internal=True)
    if not isinstance(list_data, dict):
        return list_data

    return jsonify({"success": True, 'data': list_data})


from hashlib import sha256
from random import randint, choice, uniform
from flask import Flask, request, send_file, send_from_directory
from flask_cors import CORS
#import mysql.connector
import MySQLdb
import MySQLdb.cursors
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

EMAIL_ADDRESS = "theretailnurse.coursework@gmail.com"
FILES_WAITING = {}
IMAGE_FOLDER = os.getcwd() + "\\images\\"
TEMP_FOLDER = os.getcwd() + "\\awaiting\\"

print("connected to MySql successfully!")


def execute(cmd, commit=False):
    if "DROP" in cmd: return [] # cheeky
    if ";" in cmd.strip()[:-1]: return [] # even cheekier
    db = MySQLdb.connect(
        host = "localhost",
        user = "flask",
        password = "F1@sk***8",
        database = "coursework",
        cursorclass = MySQLdb.cursors.DictCursor
    )
    cursor = db.cursor()
    cursor.execute(cmd)

    rows = cursor.fetchall()
    if commit: db.commit()
    cursor.close()
    db.close()
    return rows


@app.route('/imagelibrary/banner')
def get_banner_image():
    return send_file(f"images/banner.jpg", "image/jpg")

@app.route('/test', methods = ['GET'])
def get_test():
    if request.method != "GET": return
    return "HELLO, WORLD"
@app.route('/access/level', methods = ["POST"])
def request_access_level():
    data = request.get_json()
    token = data["token"]
    id = data["id"]

    if check_session(token, id) == 0:
        return {"code": 0, "level": get_user(id)["AccessLevel"]}
    else: return {"code": 1}
##### CODES #####
# 0 - successful
# 1 - ambiguous failure code
# 2 - email failed.
@app.route('/register/initial', methods = ["POST"])
def register_account():
    data = request.get_json()
    email = data["email"]
    password = data["password"]
    confirm = data["confirm"]

    if password != confirm: return {"code": 1} ## passwords do not match and therefore this is an invalid signup attempt.

    cursor = execute(f"SELECT Email FROM web WHERE Email = '{email}';")
    if not cursor:
        characters = "0123456789abcdefghijklmnopqrstuvwxyz"
        code = ""
        for i in range(8):
            code += choice(characters)
        
        expires = datetime.now() + timedelta(minutes = 15)
        hashBrowns = generate_pass_hash(password)
        salt = hashBrowns[1]

        send_email(email, f"""
        Hi there!
        To sign into your new account at theretailnurse.com, please use this 8-digit code!
        <h1><b>{code}</b></h1>
        """, "Account Activation Code!")


        execute(f"""
        INSERT INTO registering
        (RegisterCode, ExpirationDate, Email, Hash, Salt)
        VALUES
        ('{code}', '{expires}', '{email}', '{hashBrowns[0]}', {salt});
        """, commit = True)
        return {"code": 0}
    else: return {"code": 1} ## user exists and therefore this is an invalid signup attempt

########## CODES
## 0 - successful, account created.
## 1 - failure    
@app.route('/register/verify', methods = ["POST"])
def verify_account():
    data = request.get_json()
    email = data["email"]
    code = data["code"]

    cursor = execute(f"SELECT RegisterCode, ExpirationDate, Email, Hash, Salt FROM registering WHERE Email = '{email}';")
    if not cursor: return {"code": 1}
    else:
        registering = cursor[0]
        if registering["RegisterCode"] != code: return {"code": 1}
        if registering["ExpirationDate"] < datetime.now(): return {"code": 1}

        unique = randint(1, 100000)
        execute(f"INSERT INTO users (Name, AccessLevel) VALUES ('{unique}', 0);", commit = True)
        user = execute(f"SELECT UserID FROM users WHERE Name = '{unique}';")
        user = user[0]

        execute(f"""UPDATE users SET Name = NULL WHERE UserID = {user["UserID"]};""", commit = True)
        execute(f"""
        INSERT INTO web
        (UserID, Email, Hash, Salt)
        VALUES ({user["UserID"]}, '{registering["Email"]}', '{registering["Hash"]}', {registering["Salt"]});
        """, commit = True)
        execute(f"""DELETE FROM registering WHERE Email = '{email}';""", commit = True)
        return {"code": 0}


######## CODES 
## 0 - successful
## 1 - ambiguous failure

@app.route('/user/password/reset', methods = ["POST"])
def password_reset_initial():
    data = request.get_json()
    email = data["email"]

    cursor = execute(f"""
    SELECT WebUserID FROM web WHERE Email = '{email}';
       """)
    if not cursor: return {"code": 1}

    characters = "0123456789abcdefghijklmnopqrstuvwxyz"
    code = ""
    for i in range(8):
        code += choice(characters)

    send_email(email, f"""
    Hi there!
    There has been a request to change the password associated with your account.
    If this wasn't you, please ignore this email. If it was you, here is the requested password code.
    Code: <b>{code}</b>

    You have 10 minutes from when you sent this request to change the password, or this code will not work.
    """, "Password Reset Code!")

    execute(f"""
    INSERT INTO resets
    (ResetCode, WebID, ExpirationDate)
    VALUES ('{code}', {cursor[0]["WebUserID"]}, '{datetime.now() + timedelta(minutes = 10)}');
    """, commit = True)
    return {"code": 0}

@app.route('/user/password/verify', methods = ["POST"])
def attempt_password_reset():
    data = request.get_json()
    email = data["email"]
    code = data["code"]
    password = data["password"]

    hashBrowns = generate_pass_hash(password, salt = None)
    hash = hashBrowns[0]
    salt = hashBrowns[1]

    cursor = execute(f"""
    SELECT WebUserID FROM web WHERE Email = '{email}';
       """)
    if not cursor: return {"code": 1}
    cursor = cursor[0]
    reset = execute(f"""SELECT * FROM resets WHERE WebID = {cursor["WebUserID"]} AND ExpirationDate > '{datetime.now()}' ORDER BY ExpirationDate DESC; """)
    if not reset: return {"code": 1}
    reset = reset[0]
    if reset["ResetCode"] != code: return {"code": 1}

    execute(f"""DELETE FROM resets WHERE ResetID = {reset["ResetID"]};""", commit = True)
    execute(f"""UPDATE web SET Hash = '{hash}', Salt = {salt} WHERE WebUserID = {cursor["WebUserID"]};""", commit = True)
    return {"code": 0}

@app.route('/accounts/info/get', methods = ['POST'])
def account_get_info():
    data = request.get_json()
    token = data["token"]
    id = data["id"]
    selid = data["selid"] ## what user do we want to collect the data for? !! this is unused for users with default privilege !!

    ## This stops users without admin privilege from selecting whatever user they like.
    if check_session_admin(token, id) != 0 and check_session(token, id) == 0: selid = id
    if check_session(token, id) != 0: return "", 401

    info = execute(f"""SELECT * FROM users INNER JOIN web ON users.UserID = web.UserID WHERE users.UserID = {selid}; """)
    if not info: return "", 400
    info = info[0]

    return {
        "code": 200,
        "account": {
            "name": info["Name"],
            "address": info["Address"],
            "email": info["Email"]
        }
    }, 200

@app.route('/accounts/info/set', methods = ['POST'])
def account_change_info():
    data = request.get_json()

    token = data["token"]
    id = data["id"]
    selid = data["selid"] ## what user do we want to collect the data for? !! this is unused for users with default privilege !!

    name = data["name"]
    address = data["address"]

    ## This stops users without admin privilege from selecting whatever user they like.
    if check_session_admin(token, id) != 0 and check_session(token, id) == 0: selid = id
    if check_session(token, id) != 0: return "", 401

    info = execute(f"""SELECT * FROM users INNER JOIN web ON users.UserID = web.UserID WHERE users.UserID = {selid}; """)
    if not info: return "", 400

    execute(f"""UPDATE users SET Name = "{name}", Address = "{address}" WHERE UserID = {selid};""", commit = True)
    return "", 200


# this function is accessible by people who are not signed in and therefore
# it doesn't need a check_session verification step.
@app.route('/filter/categories/get', methods = ['POST'])
def filter_get():
    data = request.get_json()

    selected = data["selected"] # this should be a list of ids. (e.g. 1,2,3,4,5,6)

    fetched = execute("SELECT * FROM categories;")
    categories = []
    for category in fetched:
        ## the entire single line of code that makes the filter menu contextual.
        if category["RequiredAttributeID"] and not category["RequiredAttributeID"] in selected: continue

        attr = execute(f"""SELECT * FROM attributes WHERE CategoryID = {category["CategoryID"]};""")

        obj = {"category": category["Name"], "attributes": [], "ids": []}
        for attribute in attr:
            obj["attributes"].append(attribute["Name"])
            obj["ids"].append(attribute["AttributeID"])
        categories.append(obj)
    return {"code": 200, "categories": categories}

@app.route('/products/grid/get', methods = ['POST'])
def product_grid_get():
    data = request.get_json()

    filter = data["filter"]

    products = execute(f"""
        SELECT 
        products.ProductID AS PID, products.Code, products.Price, products.Suffix, products.PrimaryImageID, templates.Name AS TName, templates.Description AS TDesc,
        products.BindingID AS PBinding, templates.BindingID AS TBinding
        FROM products
        INNER JOIN templates
        ON products.TemplateID = templates.TemplateID;
        """)
    

    categories = execute(f"""SELECT * FROM categories;""")
    if not products: return "", 500 ## this shouldn't ever actually fire but there just in case.

    catalogue = []
    for product in products:
        tags = execute(f"""
        SELECT TagID, AttributeID
        FROM tags
        WHERE BindingID IN ({product["PBinding"]}, {product["TBinding"]});
        """)

        if not tags: catalogue.append(product)
        else:
            askingByCategory = {}
            for category in categories: askingByCategory[category["CategoryID"]] = []
            for f in filter:
                cid = execute("SELECT CategoryID FROM attributes WHERE AttributeID = " + str(f) + ";")[0]["CategoryID"]
                askingByCategory[cid].append(f)

            tackled = []
            allows = []
            for tag in tags:
                attribute = execute(f"""SELECT CategoryID FROM attributes WHERE AttributeID = {tag["AttributeID"]};""")[0]
                category = execute(f"""SELECT * FROM categories WHERE CategoryID = {attribute["CategoryID"]}""")[0]
                id = category["CategoryID"]
                tackled.append(id)

                if (tag["AttributeID"] in askingByCategory[id]) or (category["ShowNull"] and len(askingByCategory[id]) == 0):
                    allows.append(True)
                else: allows.append(False)
                
            
            for ask in askingByCategory.keys():
                if not askingByCategory[ask]: continue
                if not ask in tackled: allows.append(False)
            if not False in allows: catalogue.append(product)
            
            '''
            IF the category IS a shownull
            BUT we are asking for something in the category
            AND the something is not present in this tag
            THEN don't allow.
            
            
            '''
    productList = list(map(lambda p: p["PID"], catalogue))

    return {"code": 200, "products": productList}

## deals in completely unsensitive data and therefore is an unauthorized
## GET method route. 
@app.route('/images/request/list', methods = ["GET"])
def request_image_list():
    cursor = execute("SELECT ImageID FROM images;")
    return {
        "code": 200,
        "ids": list(map(lambda f: f["ImageID"], cursor))
    }
@app.route('/images/request/image', methods = ["POST"])
def request_image():
    data = request.get_json()

    try:
        id = int(data["id"])

        image = execute(f"SELECT ImageURL FROM images WHERE ImageID = {id};")[0]
        return send_from_directory("images", image["ImageURL"], mimetype = "image/jpg")
    except (TypeError, KeyError):
        return ""

@app.route('/images/bind/primary', methods = ["POST"])
def set_image_as_primary():
    data = request.get_json()

    token = data["token"]
    id = int(data["id"])

    binding = int(data["imageID"])
    product = int(data["bindingID"])

    if check_session_admin(token, id) != 0: return "", 403 # access denied

    cursor = execute(f"""SELECT PrimaryImageID FROM products WHERE BindingID = {product}; """)
    if not cursor: return "", 404 # product not found

    execute(f"""UPDATE products SET PrimaryImageID = {binding} WHERE BindingID = {product}; """, commit = True) # update primary image id
    return "", 200

@app.route('/images/bind/secondary', methods = ["POST"])
def add_image_to_binding():
    data = request.get_json()

    token = data["token"]
    id = int(data["id"])

    binding = int(data["bindingID"])
    image = int(data["imageID"])

    if check_session_admin(token, id) != 0: return "", 403 # access denied

    execute(f"""UPDATE images SET BindingID = {binding} WHERE ImageID = {image}; """, commit = True)
    return "", 200


@app.route('/images/pump/raw', methods = ["POST"])
def collect_image():
    key = generate_raw_token()

    files = []
    for f in request.files.to_dict(flat = False)["image"]:
        fileUrl = TEMP_FOLDER + generate_raw_token() + ".jpg"

        with open(fileUrl, "w") as temp:
            f.save(fileUrl)
        files.append(fileUrl)

    FILES_WAITING[key] = files
    return {"code": 200, "requestToken": key}

@app.route('/images/pump/turn', methods = ["POST"])
def authorize_image():
    data = request.get_json()

    key = data["key"]
    token = data["token"]
    id = data["id"]
    if check_session_admin(token, id) != 0: return "", 403
    elif not FILES_WAITING[key]: return "", 404

    index = len(execute("SELECT ImageID FROM images;"))

    for file in FILES_WAITING[key]:
        path = IMAGE_FOLDER + "image_uploaded" + str(index) + ".jpg"
        
        os.rename(file, path)

        execute(f"""
        INSERT INTO images
        (ImageURL)
        VALUES ('image_uploaded{str(index)}.jpg');
        """, commit = True)
        index += 1
    FILES_WAITING[key] = None
    return {"code": 200}

@app.route("/bindings/grab", methods = ["POST"])
def grab_binding_name():
    data = request.get_json()

    token = data["token"]
    id = data["id"]

    if check_session_admin(token, id) != 0: return "", 403

# grabs the order request and converts an active cart into an order object
@app.route("/orders/create", methods = ["POST"])
def create_order():
    data = request.get_json()

    token = data["token"]
    uid = int(data["id"])

    if check_session(token, uid) != 0: return "", 403
    user = execute(f"""
    SELECT users.ActiveCartID AS ACI, web.Email as Email
    FROM users 
    INNER JOIN web
    ON users.UserID = web.UserID
    WHERE users.UserID = {uid};""")
    if not user: return "", 404

    cid = user[0]["ACI"]
    email = user[0]["Email"]
    date = datetime.now()

    

    execute(f"""
    UPDATE carts SET Finished = 1 WHERE CartID = {cid}
    """, commit = True)
    execute(f"""
    INSERT INTO carts 
    (UserID, DateCreated, Finished)
    VALUES
    ({uid}, '{date}', 0);
    """, commit = True)

    ncart = execute(f"""SELECT CartID FROM carts WHERE UserID = '{uid}' ORDER BY DateCreated DESC;""")[0]
    execute(f"""UPDATE users SET ActiveCartID = {ncart["CartID"]} WHERE UserID = {uid};""", commit = True)


    ordering = execute(f"""
    SELECT 
    ordering.ProductID AS PID, templates.Name AS Name, products.Suffix AS Suffix, products.Price AS Price, ordering.Quantity AS Quantity, products.Code AS Code
    FROM ordering
    INNER JOIN products 
    ON ordering.ProductID = products.ProductID
    INNER JOIN templates
    ON products.TemplateID = templates.TemplateID
    WHERE ordering.CartID = {cid};
    """)

    message = "<ul>"
    totalCost = 4
    instructions = ""
    for order in ordering:
        cost = round(order["Price"] * order["Quantity"], 2)
        totalCost += cost

        remaining = order["Quantity"]

        stocker = execute(f"""
            SELECT stock.StockID, stock.Quantity, locations.Name AS Location
            FROM stock
            INNER JOIN locations
            ON stock.LocationID = locations.LocationID
            WHERE ProductID = {order["PID"]} AND Quantity > 0;
        """)

        for location in stocker:
            diff = location["Quantity"] - remaining
            instruction = ""
            if diff < 0: 
                remaining -= location["Stock"]
                execute(f"""UPDATE stock SET Quantity = 0 WHERE StockID = {location["StockID"]};""", commit = True)
                instruction = f"""{order["Code"]} - Take {location["Quantity"]} from {location["Location"]}.>"""
            else:
                execute(f"""UPDATE stock SET Quantity = {diff} WHERE StockID = {location["StockID"]};""", commit = True)
                instruction = f"""{order["Code"]} - Take {remaining} from {location["Location"]}.>"""
            instructions = instructions + instruction
        message += f"""<li>{order["Quantity"]}x {order["Name"]} {order["Suffix"]} - \u00A3{cost}</li>"""
    message += """</ul>"""

    execute(f"""
    INSERT INTO orders 
    (CartID, DateOrdered, PaidFor, Posted, OrderInstructions)
    VALUES
    ({cid}, '{date}', 0, 0, "{instructions}");
    """, commit = True)

    send_email(email, f"""
    This is a receipt for your recent order on theretailnurse.com!
    You ordered:
    {message}
    This amounts to \u00A3{totalCost}, including shipping.
    """, "Your Order Receipt")

    return "", 200

# grabs the order list and converts them into json objects
@app.route("/orders/load", methods = ["POST"])
def load_orders():
    data = request.get_json()

    token = data["token"]
    uid = data["id"]

    if check_session_admin(token, uid) != 0: return "", 403
    orders = execute(
        """
        SELECT orders.*, users.Address AS Address, users.Name AS Name, web.Email AS Email
        FROM orders
        INNER JOIN carts ON orders.CartID = carts.CartID 
        INNER JOIN users ON carts.UserID = users.UserID
        INNER JOIN web ON carts.UserID = web.UserID
        """
        )
    jsoned_orders = []
    for order in orders:
        oid = order["OrderID"]
        cid = order["CartID"]
        instructions = order["OrderInstructions"]

        products = execute(f"""
            SELECT 
            ordering.ProductID AS PID, templates.Name AS Name, products.Suffix AS Suffix, products.Price AS Price, ordering.Quantity AS Quantity
            FROM ordering
            INNER JOIN products 
            ON ordering.ProductID = products.ProductID
            INNER JOIN templates
            ON products.TemplateID = templates.TemplateID
            WHERE ordering.CartID = {cid};
        """)
        total = 4
        items = []
        for item in products:
            items.append(f"""{item["Quantity"]}x {item["Name"]} {item["Suffix"]}""")
            total += item["Quantity"] * item["Price"]
        total = round(total, 2)

        jsoned_orders.append({
            "id": oid,
            "instructions": instructions,
            "items": items,
            "hasPaid": order["PaidFor"],
            "hasPosted": order["Posted"],
            "orderName": order["Name"] + " - " + str(order["DateOrdered"]),
            "customerName": order["Name"],
            "customerAddress": order["Address"],
            "customerEmail": order["Email"]
        })
    return {
        "orders": jsoned_orders}, 200

# changes order status of a specified object
@app.route("/orders/paid", methods = ["POST"])
def set_order_paid():
    data = request.get_json()

    token = data["token"]
    uid = data["id"]

    oid = data["order"]
    if check_session_admin(token, uid) != 0: return "", 403
    execute(f"""UPDATE orders SET PaidFor = 1 WHERE OrderID = {oid}""", commit = True)

    return {}, 200

# changes order status of a specified object
@app.route("/orders/posted", methods = ["POST"])
def set_order_posted():
    data = request.get_json()

    token = data["token"]
    uid = data["id"]

    oid = data["order"]
    if check_session_admin(token, uid) != 0: return "", 403
    execute(f"""UPDATE orders SET Posted = 1 WHERE OrderID = {oid}""", commit = True)

    return {}, 200

# order overview
@app.route("/stats", methods = ["POST"])
def get_stats():
    data = request.get_json()

    token = data["token"]
    id = data["id"]
    if check_session_admin(token, id) != 0: return "", 403

    cursor = execute("""SELECT * FROM products; """)

    date = datetime.now()
    ordertime = date - timedelta(days = 7)
    sessions = execute(f"""SELECT * FROM sessions WHERE ExpirationDate > '{date}';""")
    order = execute(f"""SELECT * FROM orders WHERE DateOrdered > '{ordertime}';  """)

    stats = f"""We have a total of {len(cursor)} products<There are {len(sessions)} users currently logged in with an active session<{len(order)} orders have been made in the past week"""
    return {
        "stats": stats
    }, 200




# create a new random token string, unhashed
def generate_raw_token():
    tokenRaw = ""
    with open("words.txt", "r") as f:
        words = f.readlines()
        for i in range(7):
            tokenRaw += choice(words).strip()
    return tokenRaw


@app.route('/session', methods = ["POST"])
def request_session():
    data = request.get_json()
    email = data["email"]
    password = data["password"]

    cursor = execute(f"SELECT users.UserID, users.AccessLevel, web.Email, web.Hash, web.Salt FROM users INNER JOIN web ON users.UserID = web.UserID HAVING web.Email = '{email}';")
    if cursor == None: return {"code" : 1}
    else:
        row = cursor[0]
        check = generate_pass_hash(password, salt=row["Salt"])[0]
        if check == row["Hash"]:
            ##############################
            ##                          ##
            ##    SESSION GENERATION    ##
            ##                          ##
            ##############################
            sessionCursor = execute("""SELECT SessionID, ExpirationDate, SessionToken FROM sessions;""")
            activeSession = None

            now = datetime.now()
            for sess in sessionCursor:
                if sess["ExpirationDate"] > now: 
                    activeSession = sess["SessionToken"]
                    break
                else: continue

            if activeSession == None:
                tokenRaw = generate_raw_token()
                m = sha256(bytes(tokenRaw, "utf-8"))
                activeSession = m.hexdigest()
                time = timedelta(hours = 1)
                if int(row["AccessLevel"]) == 1: time = timedelta(hours = 10)
                
                sessionCursor = execute(f"""INSERT INTO sessions (UserID, Date, ExpirationDate, SessionToken) VALUES ({row["UserID"]}, '{datetime.now()}', '{datetime.now() + time}', '{activeSession}'); """,
                 commit = True)
            return {
                "code": 0,
                "id": row["UserID"],
                "token": activeSession,
                "level": row["AccessLevel"]
            }
        else: return {"code" : 3}

### RETURN CODES
## CODE 0 - ALL IS FINE
## CODE 1 - TOKEN IS INVALID
## CODE 2 - TOKEN DOESN'T EXIST.
## CODE 4 - NOT SIGNED IN.
def check_session(token, userid):
    if not token or not userid: return 4
     
    sessionCursor = execute(f"""SELECT UserID, ExpirationDate, SessionToken FROM sessions WHERE SessionToken = '{token}';""")

    if not sessionCursor: return 2
    else:
        curse = sessionCursor[0]
        if not curse: return 4
        if curse["ExpirationDate"] > datetime.now() and curse["UserID"] == userid: return 0
        else: return 1
## CODE 3 - INSUFFICIENT PERMISSION
def check_session_admin(token, userid):
    if not token or not userid: return 4
     
    sessionCursor = execute(f"""SELECT UserID, ExpirationDate, SessionToken FROM sessions WHERE SessionToken = '{token}';""")

    if not sessionCursor: return 2
    else:
        curse = sessionCursor[0]
        if not curse: return 4
        if curse["ExpirationDate"] > datetime.now() and curse["UserID"] == userid: 
            if get_user(curse["UserID"])["AccessLevel"] != 1: return 3
            else: return 0
        else: return 1

def get_user(userid):
     
    cursor = execute(f"SELECT Name, AccessLevel FROM users WHERE UserID = {userid};")

    if not cursor: return None
    else: return cursor[0]

@app.route('/attributes/update', methods = ['POST'])
def change_attributes():
    if request.method != "POST": return
    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) == 0:
         
        cursor = execute(f"""SELECT * FROM attributes WHERE Name="{js["attribute"].strip()}";""")

        attributes = cursor
        
        if attributes == None or len(attributes) == 0:
             
            cmd = f"""
            INSERT INTO attributes
            (CategoryID, Name)
            VALUES ({js["category"]},"{js["attribute"].strip()}");
            """

            execute(cmd, commit=True)
            return {"code": 0}
        elif len(attributes) == 1:
             
            cursor = execute(f"""UPDATE attributes SET CategoryID = {js["category"]} WHERE Name="{js["attribute"].strip()}";""")
            return {"code": 0}
        else: return {"code": 2}
    else: return {"code": 1}
@app.route('/attributes/list', methods = ['GET'])
def list_attributes():
    if request.method != "GET": return

    fetched = execute("SELECT * FROM categories;")
    categories = []
    for category in fetched:
        attr = execute(f"""SELECT * FROM attributes WHERE CategoryID = {category["CategoryID"]};""")

        obj = {"category": category["Name"], "attributes": [], "ids": []}
        for attribute in attr:
            obj["attributes"].append(attribute["Name"])
            obj["ids"].append(attribute["AttributeID"])
        categories.append(obj)
    return {"code": 0, "categories": categories}
"""
attributes codes
0 - all went well
1 - insufficient permission
2 - unexpected row count error
666 - unimplemented
"""



@app.route('/categories', methods = ['GET', 'POST'])
def add_new_category():
    
    if request.method == 'GET':
         
        cursor = execute(f"SELECT CategoryID, Name FROM categories;")

        catList = []
        for cat in cursor:
            catList.append({"id": cat["CategoryID"], "name": cat["Name"]})

        return {"code": 0, "categories": catList}
    elif request.method == "POST":
        js = request.get_json()
        if check_session_admin(js["token"], js["id"]) == 0:
            cursor = execute(f"""SELECT * FROM categories WHERE Name='{js["value"].strip()}';""")
            rows = cursor
            if rows == None or len(rows) == 0:
                cursor = execute(f"""INSERT INTO categories (Name, ShowNull, Multi) VALUES ('{js["value"].strip()}', {bool(js["showNull"])}, {bool(js["multi"])});""", True)
                return {"code": 0}
            elif len(rows) == 1: 
                cursor = execute(f"""UPDATE categories SET ShowNull = {bool(js["showNull"])}, Multi = {bool(js["multi"])} WHERE Name='{js["value"].strip()}';""", True)
                return {"code": 2}
            else: return {"code": 3}
        else: return {"code": 1}
   
"""
add_new_category codes
0 - all went well
1 - invalid token
2 - row updated
3 - 2 rows exist???
"""
@app.route('/products/info', methods = ['POST'])
def get_product_info():
    if request.method != "POST": return

    js = request.get_json()
    pid = int(js["id"])
    cursor = None
    try:
        cursor = execute(f"""
        SELECT 
        products.Code, products.Price, products.Suffix, products.PrimaryImageID, templates.Name AS TName, templates.Description AS TDesc, suppliers.Name AS SName, suppliers.Description AS SDesc,
        products.BindingID AS PBinding, templates.BindingID AS TBinding
        FROM products
        INNER JOIN templates
        ON products.TemplateID = templates.TemplateID
        INNER JOIN suppliers
        ON templates.SupplierID = suppliers.SupplierID
        WHERE products.ProductID = {pid};
        """)
    except Exception:
        return {"code": 4}, 404
    
    p = cursor[0]
    if not p: return {"code": 2}, 404
    else: 

        maxStock = 0
        for location in execute(f"""SELECT Quantity FROM stock WHERE ProductID = {pid};"""): maxStock += location["Quantity"]

        images = list(map(lambda f: f["ImageID"], execute(f"""SELECT ImageID FROM images WHERE BindingID IN ({p["PBinding"]}, {p["TBinding"]});""")))
        images.insert(0, p["PrimaryImageID"])

        suffix = "" if not p["Suffix"] else p["Suffix"]
        return {
        "code": 200,
        "product": {
            "code": p["Code"],
            "price": round(p["Price"], 2),
            "primaryImageID": p["PrimaryImageID"],
            "name": p["TName"] + " " + suffix,
            "description": p["TDesc"],
            "supplierName": p["SName"],
            "supplierDescription": p["SDesc"],
            "bindingProduct": p["PBinding"],
            "bindingTemplate": p["TBinding"],
            "maxOrder": maxStock,
            "images": images
            }
        }, 200

@app.route('/products/list', methods = ['GET', 'POST'])
def get_product_list():

    if request.method == "GET": 
        products = []
        for product in execute("SELECT ProductID, Code FROM products;"):
            products.append({"id": product["ProductID"], "name": product["Code"]})
        return {
            "code": 0,
            "products": products
        }
    elif request.method != "POST": return

    data = request.get_json()
    if check_session_admin(data["token"], data["id"]) == 0:
        productCursor = execute("SELECT products.ProductID, products.TemplateID, products.Code, templates.Name FROM products INNER JOIN templates ON products.TemplateID = templates.TemplateID;")

        products = []
        for pr in productCursor:
            products.append({"id" : pr["ProductID"], "template_id": pr["TemplateID"], "name": pr["Name"], "product_code" : pr["Code"]})

        productCursor = execute("SELECT SupplierID, Name FROM suppliers;")

        suppliers = []
        for soup in productCursor:
            suppliers.append({"id": soup["SupplierID"], "name": soup["Name"]})

        return {
            "code": 0,
            "products": products,
            "suppliers": suppliers
        }
    else: return {"code" : 1}

@app.route('/products/collect', methods = ['POST'])
def collect_products():
    if request.method != "POST": return

    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

     
    cursor = execute("SELECT ProductID, Code, BindingID FROM products;")
    products = []
    for product in cursor:
        products.append({"id": product["ProductID"], "name": product["Code"], "bind": product["BindingID"]})

    cursor = execute("SELECT TemplateID, Name, BindingID FROM templates;")
    templates = []
    for template in cursor:
        templates.append({"id": template["TemplateID"], "name": template["Name"], "bind": template["BindingID"]})
    return {
        "code": 0,
        "products": products,
        "templates": templates
    }


def get_new_binding():
    cursor = execute("SELECT BindingID FROM bindings WHERE Claimed = FALSE ORDER BY BindingID ASC;")
    if not cursor:
        execute("INSERT INTO bindings (Claimed) VALUES (FALSE);", commit=True)
        return get_new_binding()
    else: 
        binding = cursor[0]["BindingID"]
        execute(f"UPDATE bindings SET Claimed = TRUE WHERE BindingID = {binding};", commit=True)
        return binding

@app.route('/products/update', methods = ['POST'])
def update_product():
    if request.method != "POST": return

    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

    template = int(js["template"])
    suffix = js["suffix"]
    code = js["code"].strip()
    price = float(js["price"])

    cursor = execute(f"""SELECT * FROM products WHERE Code="{code}"; """)

    products = cursor
    if not products or len(products) == 0:
        binding = get_new_binding()


        if suffix:
            cursor = execute(f"""INSERT INTO products (TemplateID, Code, Price, Suffix, BindingID) VALUES ({template}, '{code}', {price}, '{suffix}', {binding});""", True)
        else:
            cursor = execute(f"""INSERT INTO products (TemplateID, Code, Price, BindingID) VALUES ({template}, "{code}", {price}, {binding});""", True)
    elif len(products) == 1:
        if suffix:
            cursor = execute(f"""UPDATE products SET TemplateID={template}, Suffix='{suffix}', Price={price} WHERE Code='{code}'; """, True)
        else: cursor = execute(f"""UPDATE products SET TemplateID={template}, Price={price} WHERE Code="{code}"; """, True)
    else: return {"code": 2}

    return {"code": 0}


@app.route('/products/templates/update', methods = ['POST'])
def update_product_template():
    if request.method != "POST": return

    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

    name = js["name"].strip()
    description = js["description"].strip()
    supplier = int(js["supplier"])

     
    cursor = execute(f"""SELECT * FROM templates WHERE Name="{name}";""")

    binding = get_new_binding()

    templates = cursor
    if not templates or len(templates) == 0:
        cursor = execute(f"""INSERT INTO templates (Name, Description, SupplierID, BindingID) VALUES ("{name}", "{description}", "{supplier}", {binding});""", True)
    elif len(templates) == 1:
        cursor = execute(f"""UPDATE templates SET Description="{description}", SupplierID={supplier} WHERE Name="{name}";""", True)
    else: return {"code": 2}
    
    return {"code": 0}

@app.route('/products/templates/list', methods = ['GET'])
def get_product_templates():
    if request.method != "GET": return

    cursor = execute("SELECT TemplateID, Name FROM templates;")

    templates = cursor
    ret = []
    for template in templates:
        ret.append({"id": template["TemplateID"], "name": template["Name"]})
    return {"code": 0, "templates": ret}

@app.route('/stock/list', methods = ['POST'])
def get_stock_list():
    if request.method != "POST": return
    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

    cursor1 = execute("SELECT ProductID, Code FROM products;")
    products = []
    for product in cursor1:
        cursor2 = execute(f"""SELECT Quantity FROM stock WHERE ProductID={product["ProductID"]}; """)

        quantity = 0
        for stock in cursor2:
            quantity += int(stock["Quantity"])
        products.append(
            {
                "id": product["ProductID"],
                "code": product["Code"],
                "quantity": quantity
            }
        )
    return {"code": 0, "stock": products}

@app.route('/stock/info', methods = ['POST'])
def get_stock_info():
    if request.method != "POST": return
    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

     
    cursor = execute(f"""SELECT Code FROM products WHERE ProductID = {js["product"]}""")
    products = cursor
    if not products or len(products) == 0: return {"code": 2}

    cursor = execute(f"""
        SELECT stock.StockID, stock.Quantity, locations.Name, locations.Description
        FROM stock
        INNER JOIN locations
        ON stock.LocationID = locations.LocationID
        WHERE stock.ProductID = {js["product"]};
    """)
    stock = []
    for loc in cursor:
        stock.append({
            "id": loc["StockID"],
            "quantity": loc["Quantity"],
            "name": loc["Name"].strip(),
            "description": loc["Description"]
        })
    return {"code": 0, "stock": stock, "productCode": products[0]["Code"]}

@app.route('/stock/locations/get', methods = ['POST'])
def get_locations():
    if request.method != "POST": return
    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

     
    cursor = execute("""SELECT LocationID, Name FROM locations;""")

    locations = []
    for loc in cursor:
        locations.append({"id": loc["LocationID"], "name": loc["Name"] })
    return {"code": 0, "locations": locations}

@app.route('/stock/change', methods = ['POST'])
def change_stock():
    if request.method != "POST": return
    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

    mode = js["mode"].strip()
    quantity = int(js["quantity"])
    product = int(js["product"])
    location = int(js["location"])

     
    cursor = execute(f"""
        SELECT StockID, Quantity
        FROM stock
        WHERE
        ProductID = {product} AND
        LocationID = {location}
    """)

    stock = cursor
    if not stock or len(stock) == 0:
        cursor = execute(f""" 
        INSERT INTO stock
        (ProductID, LocationID, Quantity)
        VALUES ({product}, {location}, {quantity});
        """, True)
    elif len(stock) == 1:
        cq = int(stock[0]["Quantity"])
        cursor = execute(f""" 
        UPDATE stock
        SET Quantity = {cq + quantity if mode == "add" else quantity}
        WHERE
        ProductID = {product} AND
        LocationID = {location}
        """, True)
    else: return {"code": 2}

    return {"code": 0}

@app.route('/cart/add', methods = ['POST'])
def add_to_cart():
    if request.method != "POST": return

    js = request.get_json()
    if check_session(js["token"], js["id"]) != 0: return "", 403

    if int(js["quantity"]) < 1: return "", 400

     
    cursor = execute(f"""SELECT ActiveCartID FROM users WHERE UserID = {js["id"]};""")

    users = cursor
    if not users or len(users) == 0: return "", 404
    elif len(users) == 1:
        cid = users[0]["ActiveCartID"]
        if not cid: return "", 500

        cursor = execute(f"""SELECT OrderingID, Quantity, ProductID FROM ordering WHERE ProductID = {js["product"]} AND CartID = {cid};""")
        order = cursor
        if not order or len(order) == 0: 
            cursor = execute(f"""
            INSERT INTO ordering
            (CartID, ProductID, Quantity)
            VALUES
            ({cid}, {js["product"]}, {js["quantity"]});
            """, commit = True)
        else:
            cursor = execute(f""" 
            UPDATE ordering
            SET Quantity = {int(js["quantity"]) + order[0]["Quantity"]}
            WHERE ProductID = {js["product"]} AND CartID = {cid};
            """, commit = True)
        return {}, 200
    else: return "", 404

@app.route('/cart/get', methods = ['POST'])
def get_cart():
    if request.method != "POST": return
    js = request.get_json()
    if check_session(js["token"], js["id"]) != 0: return "", 403

     
    cursor = execute(f"""SELECT ActiveCartID FROM users WHERE UserID = {js["id"]};""")

    users = cursor
    if not users or len(users) == 0: return "", 404
    elif len(users) == 1:
        cid = users[0]["ActiveCartID"]

        if not cid:
            timestamp = datetime.now()

            cursor = execute(f"""SELECT CartID FROM carts WHERE Finished = FALSE AND UserID = {js["id"]} ORDER BY DateCreated ASC;""")
            if not cursor: 
                execute(f"""INSERT INTO carts (UserID, DateCreated) VALUES ({js["id"]}, '{timestamp}');""", commit = True)
                cursor = execute(f"""SELECT CartID FROM carts WHERE Finished = FALSE AND UserID = {js["id"]} ORDER BY DateCreated ASC;""")
            cid = cursor[0]["CartID"]
            cursor = execute(f"""UPDATE users SET ActiveCartID = {cid} WHERE UserID = {js["id"]};""", commit = True)
            return {"cart": [], "total": 0}, 204
        cursor = execute(f"""SELECT OrderingID, ProductID, Quantity FROM ordering WHERE CartID = {cid};""")

        cart = []
        total = 0
        for ordering in cursor:
            prodCursor = execute(f"""
            SELECT 
            products.ProductID, products.Price, products.Suffix, products.PrimaryImageID, templates.Name, templates.Description 
            FROM products
            INNER JOIN templates
            ON products.TemplateID = templates.TemplateID
            WHERE products.ProductID = {ordering["ProductID"]};""")
            product = prodCursor[0]
            total += product["Price"] * ordering["Quantity"]
            cart.append({
                "product": {
                    "id": product["ProductID"],
                    "name": product["Name"],
                    "description": product["Description"],
                    "suffix": product["Suffix"],
                    "image": product["PrimaryImageID"],
                    "price": round(product["Price"],2)
                },
                "quantity": ordering["Quantity"]
            })
        if len(cart) == 0: return "", 204
        return {"code": 0, "cart": cart, "total": round(total, 2)}, 200
    else: return "", 500

@app.route('/suppliers', methods = ['GET', 'POST'])
def get_suppliers():
    if request.method == "GET":
         
        cursor = execute("SELECT SupplierID, Name FROM suppliers;")

        suppliers = []
        for soup in cursor:
            suppliers.append({"id": soup["SupplierID"], "name": soup["Name"]})
        return {
            "code": 0,
            "suppliers": suppliers
        }
    elif request.method == "POST":
        js = request.get_json()
        if check_session_admin(js["token"], js["id"]) == 0:
            name = js["name"].strip()
            description = js["description"].strip()

             
            cursor = execute(f"""SELECT * FROM suppliers WHERE Name="{name}";""")

            suppliers = cursor
             
            if not suppliers or len(suppliers) == 0:
                cursor = execute(f"""INSERT INTO suppliers (Name, Description) VALUES ("{name}", "{description}");""", True)
            elif len(suppliers) == 1:
                cursor = execute(f"""UPDATE suppliers SET Description="{description}" WHERE Name="{name}";""", True)
            else: return {"code": 2}

            return {"code": 0}
        else: return {"code": 1}

@app.route('/tags/add', methods = ['POST'])
def add_tag():
    if request.method != "POST": return

    js = request.get_json()
    if check_session_admin(js["token"], js["id"]) != 0: return {"code": 1}

    attribute = js["attribute"]
    linking = js["linking"]

    execute(f"""
    INSERT INTO tags
    (AttributeID, BindingID)
    VALUES ({attribute}, {linking});
    """, commit = True)

    return {"code": 0}


def generate_pass_hash(password, salt = None):
    m = sha256()
    if salt == None:
        salt = randint(0, 427000000)
    
    m.update(bytes(password + str(salt), "utf-8"))
    return (m.hexdigest(), salt)

def send_email(to, body, subject = "null"):
    message = MIMEMultipart()
    message["Subject"] = subject
    message["From"] = EMAIL_ADDRESS
    message["To"] = to

    body = body.replace("\n", "<p>")
    body = "<html><body><img src='theretailnurse.com/imagelibrary/banner'></img><p>" + body + "</body></html>"

    part = MIMEText(body, "html")
    message.attach(part)
    
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(EMAIL_ADDRESS, "ngqsrkgiubnjqzum")

        server.send_message(message, EMAIL_ADDRESS, to)
        print(f"Sent <{subject}> email to {to} at {datetime.now()}.")

if __name__ == "__main__":
    app.run(debug=True)

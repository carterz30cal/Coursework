async function fetchGetRequest(url) {
    const response = await fetch("http://localhost/" + url,
        {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        });
    return await response.json();
}

async function fetchPostRequest(url, fbody) {
    const response = await fetch("http://localhost/" + url,
        {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            },
            body: JSON.stringify(fbody)
        });
    if (response.status != 200) return response;
    else {
        let resp = await response.json();
        resp.status = response.status;
        return await resp;
    }
}

async function fetchPostRequestNoJSON(url, fbody) {
    const response = await fetch("http://localhost/" + url,
        {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            },
            body: JSON.stringify(fbody)
        });
    return response;
}

async function fetchPostRequestFile(url, fbody) {
    const response = await fetch("http://localhost/" + url,
        {
            method: "POST",
            body: fbody
        });
    return await response.json();
}

/*
53 bit hash function
sourced from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
by bryc
*/
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
  
const convArray = (array) => {
    let converted = "";
    for (let a in array) {
        converted += array[a];
    }
    return converted;
}


function createInputLabel(input, name) {
    return e("label", {id: input.props.id + "-label", key: input.props.id + "-label", htmlFor: input.props.id, className: "admin-label"}, name);
}



function sortCart(cart) {
    // This is a quicksort implementation which will sort the cart by price.
    let array = [];
    for (let c in cart) {
        let price = cart[c].product.price * cart[c].quantity;
        array.push([cart[c], price]); // construct a new array with the calculated prices and the original item
    }
    quick(array, 0, array.length - 1);

    let final = [];
    for (let a in array) {
        final.push(array[a][0]); // reconstruct the original array's structure but sorted. 
    }
    final = final.reverse() // we actually want the most expensive item at the start, so reverse the list.
    return final;
}
function quick(array, low, high) {
    // a quick sanity check to make sure that the bounds are actually in order.
    // if they aren't, just do nothing.
    // this is also the termination condition, as when low = high (when we have 1 element) it won't do anything.
    if (low < high) {
        piv = partition(array, low, high)
        quick(array, low, piv - 1); // recursively call itself with smaller bounds, twice
        quick(array, piv + 1, high);
    }
}
function partition(array, low, high) {
    let pivot = array[high];

    let right = low - 1;

    for (let i = low; i <= high - 1; i++) {
        if (array[i][1] < pivot[1]) { // compare item prices
            right++;

            // swap array[right] and array[i]
            let temp = array[right];
            array[right] = array[i];
            array[i] = temp;
        }
    }
    let temp = array[right + 1];
    array[right + 1] = array[high];
    array[high] = temp;
    return right + 1; // return the pivot index.
}

const e = React.createElement;


/*
a global website object, this is displayed at the top of every
single window within the site, and is the hub for navigation and account
management.

*/
class Topbar extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user; // holds user's session token and user id, as well as their access level (this is just for rendering purposes, server actions don't use this at all.)
        this.openLoginHandler = props.loginHandler; // function which toggles the login menu when called
        this.openAdminHandler = props.adminHandler; // function which changes window to the admin window
        this.openAccountHandler = props.accountHandler; // function to open the account menu when called

        this.screen = props.screen;
        this.inAdminScreen = props.inAdminScreen === undefined ? false : props.inAdminScreen;
    }

    render() {
        // title text that changes depending on whether we're in the admin screen or not.
        let title = e(GenericText, { area: "global", text: this.inAdminScreen ? "Admin Screen" : "The Retail Nurse", type: "title" });
        let buttons = [];

        // if there isn't a user logged in currently, we want to show the login option on the navigation bar.
        if (this.user == null || this.user.token == null || this.user.id == null) {
            buttons.push(e(GenericButton, { area: "global", text: "Log in", click: this.openLoginHandler }));
        }
        else {
            // if we're an admin, display the extra window switch button which lets us into the admin screen.
            // the text on this button depends on whether we're in the admin screen or not.
            switch (this.screen) {
                case "PURCHASING":
                case "ADMIN":
                    buttons.push(e(GenericButton, {area: "global", text: "Customer", click: this.openAdminHandler}));
                    break;
                case "CUSTOMER":
                    if (this.user.admin) buttons.push(e(GenericButton, {area: "global", text: "Admin", click: this.openAdminHandler}));
                    break;
            }
            //if (this.user.admin) buttons.push(e(GenericButton, { area: "global", text: this.inAdminScreen ? "Main" : "Admin", click: this.openAdminHandler }));
            buttons.push(e(GenericButton, { area: "global", text: "Account", click: this.openAccountHandler}));
        }

        // contain the buttons within a flexbox so they look nice.
        let buttonBox = e("div", {id: "global-topbar-buttons"}, buttons);

        return e("div", {id: "global-topbar"}, title, buttonBox);
    }
}

/*
 * This class exists only because we use the dimmer twice and i wanted
 * it to be neat.
 */
class WindowDimmer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return e("div", {className: "global-dimmer"});
    }
}

/*
This object allows for simple windows that contain a close button to be
created. Width and height are defined within the props using winWidth and winHeight respectively.
Close event is defined within props using winCloseHandler.
Body is defined using winBody;
*/
class WindowContainer extends React.Component {
    constructor(props) {
        super(props);

        this.closeHandler = props.winCloseHandler;
        this.body = props.winBody;
        this.dimmer = props.dim;
        this.style = {
            width: props.winWidth,
            height: props.winHeight
        };
    }

    render() {
        // creates a circular red close button, somewhat reminiscent of the mac style buttons.
        // also encapsulates it within a flexbox to position it correctly.
        let buttonClose = e(GenericButton, { area: "global-close", click: this.closeHandler });
        let minibar = e("div", { className: "global-minibar" }, buttonClose);

        let window = e("div", {className: "global-window", style: this.style}, minibar, this.body);
        if (this.dimmer) return e("div", null, e(WindowDimmer), window);
        else return window;
    }
}

/*
this is a more react-y way of creating generic button objects than using a function
it will also stop usage of overload functions, which are incredibly rubbish in JavaScript
despite being a really useful feature in most languages.

*/
class GenericButton extends React.PureComponent {
    constructor(props) {
        super(props);

        // area is just a shorter way to define what css class i want an element to drag from.
        // it saves writing {className: 'blahblahblah'} for every single object.
        // it also forces me into reusing classes wherever possible.
        this.area = props.area === undefined ? "global" : props.area;
        this.text = props.text; // text present on the button
        this.click = props.click; // function to be called on the onClick event.

        // submit button types have a few extra html functions, so there's an option for that
        this.submitter = props.submit === undefined ? false : props.submit;


        // allows for additional custom styling for niche scenarios
        this.style = props.style === undefined ? {} : props.style;
        this.style.gridArea = props.gridArea;
        this.colour = props.colour;
    }

    render() {
        return e("button", {className: this.area + "-button", key: this.text ,type: this.submitter ? "submit" : "button", autoFocus: this.submitter, onClick: this.click, style: this.style}, e("p", {style: {color: this.colour}}, this.text));
    }
}

/*
Continuing my reconstruction of helper functions into pure react components
Inputs are probably the object type i use the most and therefore they need a well made class
with lots of little helping hands.

*/
class GenericInput extends React.PureComponent {
    constructor(props) {
        super(props);

        this.area = props.area === undefined ? "global" : props.area;
        this.text = props.text;
        this.form = props.form;
        let split = this.text.split(" ");
        this.textBit = split[0];

        // html input type. this defines how they are displayed and their functionality. default is text as that is the most versatile and often used type.
        this.type = props.type === undefined ? "text" : props.type;

        // file inputs need additional data.
        if (this.type === "file") {
            this.accept = props.accept == undefined ? ".jpg, .jpeg" : props.accept; // what file types do we accept? supports MIMETYPE and file extensions.
            this.multiple = props.multiple === undefined ? false : props.multiple; // accepts multiple files?
            this.name = props.name; // required for sending files over requests.
            this.reff = props.reff; // file inputs are treated as uncontrolled components in react and therefore work best as a reference.
        }

        this.includeLabel = props.label === undefined ? true : props.label; // do we want this input to have a label attached?
        this.contain = props.contain === undefined ? false : props.contain; // store object in a global-inputcontainer?
        this.containMax = props.containMax === undefined ? false : props.containMax; // store object in a global-inputcontainer-max?
        // containMax takes priority.

        this.value = props.value; // undefined is actually the acceptable and preferred value here for a null input and so we do not need a null check.

        this.handleInput = props.handleInput; // what function is called when we input a new value into the input?
        this.handleChange = props.handleChange; // ditto above, but only gets called when we stop editing the value. required for some input types.

        this.objType = props.objType === undefined ? "input" : props.objType; // some html form inputs are not defined as 'input'.
        if (this.textarea) this.objType = "textarea"; //shorthand for {objType: "textarea"}

        this.disabled = (props.disabled === undefined) ? false : props.disabled; // can we interact with this object?
        if (this.handleChange == null && this.handleInput == null && props.disabled === undefined) this.disabled = true; // forces a disabled state if there aren't any input handlers on the object.

        this.children = props.children === undefined ? null : props.children;

        this.style = props.style === undefined ? {} : props.style;
    }

    render() {
        let label;
        let id = this.area + "-input-" + this.type + "-" + this.includeLabel + "-" + this.textBit;
        if (this.includeLabel) label = e("label", {htmlFor: id, key: id + "-label", className: this.area + "-label"}, this.text);

        let attr = {id: id, key: id, className: this.area + "-input" + (!this.disabled ? "" : "-disabled"), type: this.type, onInput: this.handleInput, 
            onChange: this.handleChange, defaultValue: this.value, placeholder: this.value, readOnly: this.disabled, tabIndex: (this.disabled ? -1 : 0), form: this.form,
            style: this.style
        };

        // if this input is a file type, add additional properties
        if (this.type === "file") {
            attr.accept = this.accept;
            attr.multiple = this.multiple;
            attr.name = this.name;
            attr.ref = this.ref;
        }

        let input = e(this.objType, attr, this.children);

        if (this.containMax) return e("div", {className: "global-inputcontainer-max"}, label, input);
        else if (this.contain) return e("div", {className: "global-inputcontainer"}, label, input);
        else return [label, input];
    }
}

/*

Probably the least useful of my generic classes but i might need something added later.
*/
class GenericText extends React.PureComponent {
    constructor(props) {
        super(props);

        this.area = props.area === undefined ? "global" : props.area;
        this.text = props.text === undefined ? " " : props.text;

        // replace spaces with tildes, for the key. 
        this.converted = this.text.replace(/ /g, "~");
        this.colour = props.colour === undefined ? "black" : props.colour;
        this.description = props.description === undefined ? false : props.description;

        let type;
        switch (props.type) {
            default:
                type = "p";
                break;
            case "title":
                type = "h2";
                break;
            case "subtitle":
                type = "h3";
                break;
        }
        this.type = type;

        this.style = props.style === undefined ? {} : props.style;
        this.style.color = this.colour;
        this.style.gridArea = props.gridArea;
    }

    render() {
        if (this.description) {
            let presplit = this.text.replaceAll(">", ";");
            let split = presplit.split(";");
            let list = [];
            for (let s in split) {
                list.push(e(this.type, {key: this.area + "-" + this.converted + "-" + s, style: this.style}, split[s]))
            }
            return list;
        }
        else return e(this.type, {key: this.area + "-" + this.converted, className: this.area + "-text", style: this.style}, this.text);
    }
}
/*
 * simple error class which allows handling of string error messages.
 * essentially an extension of the generic text class which has built in null checks so that we  
 * dont need them in the actual classes that use this.
 * 
 * 
 */
class GenericError extends React.PureComponent {
    constructor(props) {
        super(props);
        this.text = props.text;
    }

    render() {
        if (this.text === null) return null;
        else return e(GenericText, {text: this.text, colour: "red"})
    }
}


/*
 * quality of life class which allows us to state the image url
 * and not worry about the download of the image if it's on our server.
 * accepts traditional urls and also image ids for product images.
 * 
 */

class GenericImage extends React.Component {
    constructor(props) {
        super(props);
        this.url = props.url;
        this.area = props.area;
        this.gridArea = props.gridArea;

        this.handleClick = props.handleClick;

        this.requiresProcessing = props.process === undefined ? false : props.process; // is this an image that needs to be fetched from the server?
        if (!this.requiresProcessing) {
            this.state = {url: this.url};
        }
        else {
            fetchPostRequestNoJSON("images/request/image", {
                id: this.url
            })
            // standard example readable stream consumption from https://developer.mozilla.org/en-US/docs/web/api/streams_api/using_readable_streams
            .then((response) => {
                const reader = response.body.getReader();
                return new ReadableStream({
                  start(controller) {
                    return pump();
                    function pump() {
                      return reader.read().then(({ done, value }) => {
                        // When no more data needs to be consumed, close the stream
                        if (done) {
                          controller.close();
                          return;
                        }
                        // Enqueue the next data chunk into our target stream
                        controller.enqueue(value);
                        return pump();
                      });
                    }
                  },
                });
              })
              // Create a new response out of the stream
              .then((stream) => new Response(stream))
              // Create an object URL for the response
              .then((response) => response.blob())
              .then((blob) => URL.createObjectURL(blob))
              // Update image
              .then((url) => this.setState({url: url}))
              .catch((err) => console.error(err));

            this.state = {url: null};
        }
    }

    render() {
        if (this.state.url === null) return null;
        else return e("img", {
            key: "img-" + this.url, src: this.state.url, className: this.area + "-image",
            onClick: this.handleClick,
            style: {
                gridArea: this.gridArea
            }
        });
    }
}

class PurchasingScreen extends React.Component {
    constructor(props) {
        super(props);

        // every Main class handler.
        //this.purchaseHandler = props.purchaseHandler;
        this.openMainHandler = props.mainHandler;
        //this.openLoginHandler = props.loginHandler;
        this.openAdminHandler = props.adminHandler;
        this.openAccountHandler = props.accountHandler;

        this.user = props.user;

        fetchPostRequest("cart/get", {
            token: this.user.token,
            id: this.user.id
        })

            .then(response => {
                if (response.status == 200) {
                    this.setState({ cart: response.cart, cost: response.total, error: null });
                }
                else if (response.status == 403 || response.status == 500 || response.status == 204) {
                    this.mainHandler();
                }
                else this.setState({ cart: null, error: "Unexpected error occurred." });
            })
            .catch(() => { this.setState({ cart: null, error: "Unexpected error occurred." }); });

        this.state = {
            cart: null,
            cost: 0,
            error: null
        };
    }

    handleFinish = () => {
        fetchPostRequest("orders/create", {
            token: this.user.token,
            id: this.user.id
        }).then(response => {
            if (response.status == 200);
        })
        .catch(() => {});
    }


    render() {
        let topbar = e(Topbar, { user: this.user, screen: "PURCHASING", mainHandler: this.openMainHandler, loginHandler: null, adminHandler: this.openAdminHandler, accountHandler: this.openAccountHandler });

        let cart = e(PurchasingCart, { user: this.user, cart: this.state.cart, key: "c-" + this.state.cost});
        let information = e(PurchasingInfo, { user: this.user, cart: this.state.cart, key: "i-" + this.state.cost, cost: this.state.cost, orderHandler: this.handleFinish});

        return [topbar, e("div", {
            id: "purchasing-screen",
            key: "purchasing-screen",
            style: {
                display: "flex",
                flexFlow: "row nowrap",
                justifyContent: "flex-start",
                minHeight: "94vh",
                height: "94vh"
            }
        }, cart, information)];
    }
}

class PurchasingCart extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.cart = props.cart;
        this.state = {
            cart: this.cart,
            error: null
        }
    }

    render() {
        let cart = e(GenericText, { area: "purchasing", text: "Loading cart..." });
        if (this.state.error != null) {
            cart = e(GenericError, { text: this.state.error });
        }
        else if (this.state.cart != null) {
            // populate the cart with cart items
            cart = [];
            for (let i = 0; i < this.state.cart.length; i++) {
                cart.push(e(PurchasingCartItem, { product: this.state.cart[i] }));
            }
        }
        return e("div", { id: "purchasing-cart" }, cart);
    }
}

class PurchasingCartItem extends React.PureComponent {
    constructor(props) {
        super(props);

        this.item = props.product;
    }

    render() {
        let textName = e(GenericText, { area: "purchasing", gridArea: "name", text: this.item.product.name + " " + this.item.product.suffix, type: "subtitle" });
        let textQuantity = e(GenericText, { area: "purchasing", gridArea: "quantity", text: "x" + this.item.quantity });
        let textPrice = e(GenericText, { area: "purchasing", gridArea: "price", text: "\u00A3" + this.item.product.price });
        let imagePrimary = e(GenericImage, { area: "purchasing", gridArea: "image", url: this.item.product.image, process: true });

        return e("div",
            { key: "incart-" + this.item.product.id, className: "purchasing-item"},
            textName, textQuantity, textPrice, imagePrimary
        );
    }
}

class PurchasingInfo extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.cart = props.cart;
        this.cost = props.cost;
        this.orderHandler = props.orderHandler;
        this.state = { account: null, error: this.user === null ? "Not logged in!" : null };

        if (this.user == null) return;
        fetchPostRequest("accounts/info/get", { token: this.user.token, id: this.user.id, selid: this.user.id })
            .then(response => {
                if (response.status == 200) { // all is well, the account information has been fetched correctly.
                    this.setState({ account: response.account, error: null });
                }
                else this.setState({ error: "Failure to load account, please reload the page." }); 
        })
            .catch(() => { this.setState({ error: "Failure to load account, please reload the page." }); }); 
    }

    handlePurchase = () => {
        this.orderHandler();
    }

    render() {
        let content;
        if (this.state.error != null) content = e(GenericError, {text: this.state.error});
        else if (this.state.account == null || this.cart == null) {
            content = e(GenericText, { area: "purchasing", text: "Loading information..." });
        }
        else {
            let textName = e(GenericText, { area: "purchasing", gridArea: "name", text: this.state.account.name, type: "title"});
            let textAddress = e(GenericText, { area: "purchasing", gridArea: "address", text: this.state.account.address });
            let textEmail = e(GenericText, { area: "purchasing", gridArea: "email", text: this.state.account.email });
            let textEmailInfo = e(GenericText, { area: "purchasing", gridArea: "emailInfo", text: "Please ensure this email is up-to-date, as your receipt and any further details will come through this email address." });

            let textSubtotal = e(GenericText, { area: "purchasing", text: "Subtotal: \u00A3" + this.cart.total, type: "subtitle" });
            let textShipping = e(GenericText, { area: "purchasing", text: "Shipping: \u00A34.00" });
            let textTotal = e(GenericText, { area: "purchasing", text: "Total: \u00A3" + (this.cart.total + 4), type: "subtitle" });

            let pricing = e("div", {
                style: {
                    gridArea: "pricing",
                },
                key: "pricing"
            }, textSubtotal, textShipping, textTotal);

            let button = e(GenericButton, { area: "purchasing", gridArea: "button", text: "Finalise order!", type: "submit", click: this.handlePurchase });

            content = [textName, textAddress, textEmail, textEmailInfo, pricing, button];
        }
        return e("div", { id: "purchasing-info" }, content);
    }
}




/*
This menu is where a user will be able to manage their account. 
It will include functions such as:
- changing account details
- adding name + address
*/
class AccountMenu extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.show = props.show;
        this.logoutHandler = props.logoutHandler;
        this.updateHandler = props.updateHandler;
        this.closeHandler = props.closeHandler;

        if (this.show) {
            fetchPostRequest("accounts/info/get", {token: this.user.token, id: this.user.id, selid: this.user.id}).then(response => {
                if (response.status == 200) { // all is well, the account information has been fetched correctly.
                    this.setState({account: response.account, menu: "GENERAL"});
                }
                else this.closeHandler(); // oops, something went wrong and therefore we should close the account screen.
            })
            .catch(() => {this.closeHandler()}); // ditto above
        }
        this.state = {
            menu: "NULL",
            account: null
        };
    }

    handleChangeScreen(screen) {
        // i made this into a separate function in case i ever needed to adjust other bits of the state when the window was changed.
        this.setState({menu: screen});
    }

    handleClickGeneral = () => {
        this.handleChangeScreen("GENERAL");
    }

    handleClickAddresses = () => {
        this.handleChangeScreen("ADDRESSES");
    }

    handleChangeDetails = (name, address) => {
        fetchPostRequest("accounts/info/set", { // send a request to change user details. requires either an admin's token or the correct user's current token to work.
            token: this.user.token,
            id: this.user.id,
            selid: this.user.id,
            name: name,
            address: address
        }).catch(() => {});
        this.updateHandler(); // refresh the menu to show changes made.
    }



    render() {
        if (!this.show) return null;
        else {
            let body = [];
            body.push(e(GenericText, { area: "account-title", text: "Account", type: "subtitle" }));

            let buttonGeneral = e(GenericButton, {area: "account-menu", text: "General", click: this.handleClickGeneral});
            let buttonAddresses = e(GenericButton, {area: "account-menu", text: "Addresses", click: this.handleClickAddresses});

            let menu = e("div", {id: "account-menu"}, buttonGeneral, buttonAddresses);

            let elements = null;
            if (this.state.account == null) {
                elements = e(AccountMenuLoading);
            }
            else {
                switch (this.state.menu) {
                default:
                case "NULL": return null;
                case "GENERAL":
                    elements = e(AccountMenuGeneral, {user: this.user, account: this.state.account, logoutHandler: this.logoutHandler, handleChange: this.handleChangeDetails});
                    break;
                case "ADDRESSES":
                    elements = e(AccountMenuAddresses, {user: this.user, account: this.state.account, handleChange: this.handleChangeDetails});
                }
            }

            let content = e("div", {id: "account-content"}, elements);

            body.push(e("div", {id: "account-container"}, menu, content));
            return e(WindowContainer, {winWidth: '750px', winHeight: '600px', winBody: body, winCloseHandler: this.closeHandler, dim: true, key: this.state.menu});
        }
    }
}
/*
 * made into a class incase i want to add animation later
 * 
 */
class AccountMenuLoading extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        return e(GenericText, { area: "account", text: "Loading..." });
    }
}

class AccountMenuAddresses extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.account = props.account;

        // handler to change all of the user's details
        this.handleChange = props.handleChange;

        // large text box to input the user's address into. 
        this.inputAddress = e(GenericInput, {area: "account", text: "Address", value: this.account.address, textarea: true, handleInput: this.handleChangeAddress});
        this.info = e(GenericText, {area: "account", description: true, text: "If your shipping and billing addresses differ, please;write both down and state which is which. Thanks!;Please also ensure that the address is detailed enough."});

        this.buttonApply = e(GenericButton, {area: "account", text: "Apply Changes", click: this.handleClickApply});


        this.state = {
            address: this.account.address
        }
    }

    handleChangeAddress = (event) => {
        this.setState({address: event.target.value});
    }
    handleClickApply = () => {
        this.handleChange(this.account.name, this.state.address); // name in this instance is unchanging but still needs to be passed.
    }

    render() {
        let filler = e("div", {style: {flexGrow: 1}, key: "filler"}); // empty component which just fills some of the dead space for structuring purposes.
        return [this.inputAddress, this.info, filler, this.buttonApply];
    }
}

class AccountMenuGeneral extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.account = props.account;

        this.logoutHandler = props.logoutHandler;
        
        this.handleChange = props.handleChange;

        this.inputName = e(GenericInput, {area: "account", text: "Name", value: this.account.name, handleInput: this.handleChangeName});
        this.inputEmail = e(GenericInput, {area: "account", text: "Email", value: this.account.email, disabled: true});
        this.info = e(GenericText, {area: "account", description: true, text: "You must have a name and address attached;to your account in order to buy anything.;Facebook accounts will have this attached automatically."})

        this.buttonApply = e(GenericButton, {area: "account", text: "Apply Changes", click: this.handleClickApply});
        this.buttonLogout = e(GenericButton, {area: "account", text: "Logout", click: this.handleClickLogout});

        this.state = {
            name: this.account.name
        };
    }

    // allows a user to change their name, whilst leaving their address untouched.
    handleClickApply = () => {
        this.handleChange(this.state.name, this.account.address);
    }

    handleClickLogout = () => {
        this.logoutHandler();
    }

    // controls the name state
    handleChangeName = (event) => {
        this.setState({name: event.target.value});
    }

    render() {
        let row = e("div", {style: {
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: "10px",
            key: "row"
        }}, this.buttonApply, this.buttonLogout);

        let filler = e("div", {style: {flexGrow: 1}, key: "filler"});
        return [this.inputName, this.inputEmail, this.info, filler, row];
    }
}

/*
 * The customer screen is where customers can add and remove products from their
 * carts, and also where they can view key information about products. This is done in a grid format.
 * This component acts as the controlling component of this screen and handles every action
 * done on this screen. 
 */
class CustomerScreen extends React.Component {
    constructor(props) {
        super(props);

        // every Main class handler.
        this.purchaseHandler = props.purchaseHandler;
        this.openLoginHandler = props.loginHandler;
        this.openAdminHandler = props.adminHandler;
        this.openAccountHandler = props.accountHandler;
        
        this.user = props.user == null ? {id: null, token: null, admin: false} : props.user;

        this.state = {cartid: 0, filter: [], hash: ""};
    }

    handleUpdateProductGrid = (f) => {
        let h = cyrb53(convArray(f), 420);
        this.setState({filter: f, hash: h});
    }
    // if we've added a product to the cart, send a request asking to update the user's cart information
    // and then refresh the cart object.
    handleAddToCart = (id, quantity) => {
        fetchPostRequest("cart/add", {
            token: this.user.token,
            id: this.user.id,
            product: id,
            quantity: quantity
        })
        .then(response => {
            if (response.status == 200) this.setState({cartid: this.state.cartid + 1}); // only update the cart if the request was successful
        })
        //.catch(() => {}); // catch any errors thrown
    }

    render() {
        let topbar = e(Topbar, {user: this.user, screen: "CUSTOMER", loginHandler: this.openLoginHandler, adminHandler: this.openAdminHandler, accountHandler: this.openAccountHandler});
        let filter = e(CustomerSidebarFilter, {updateGridHandler: this.handleUpdateProductGrid});
        let content = e(CustomerProductGrid, {handler: this.handleAddToCart, filter: this.state.filter, key: this.state.hash});
        let cart = e(CustomerSidebarCart, {token: this.user.token, uid: this.user.id, key: "cartid-" + this.state.cartid, purchaseHandler: this.purchaseHandler});

        return e("div", null, topbar, e("div", {id: "customer-screen"}, filter, content, cart));
    }
}

class CustomerProductGrid extends React.PureComponent {
    constructor(props) {
        super(props);

        this.filter = props.filter;
        this.handler = props.handler;
        this.state = {products: null, error: false};

        // request a filtered list of products.
        fetchPostRequest("products/grid/get", {
            filter: this.filter
        })
        .then(response => {
            if (response.code == 200) {
                this.setState({error: false, products: response.products});
            }
            else this.setState({error: true});
        })
        .catch(() => {this.setState({error: true});});
    }

    render() {
        let products = [];

        // display generic error or loading text if we have no product ids.
        if (this.state.error) products = e(GenericError, { text: "Failed to load products." });
        else if (this.state.products === null) products = e(GenericText, { text: "Loading products...", area: "customer" })
        else {
            // loop through all product ids and create a grid item for them.
            for (let p in this.state.products) {
                let product = this.state.products[p];
                products.push(e(CustomerProductGridItem, { key: "p-" + product, product: product, handler: this.handler }));
            }
        }

        return e("div", { className: "customer-main" }, products);
    }
}

class CustomerProductGridItem extends React.Component {
    constructor(props) {
        super(props);

        this.product = props.product;
        this.handler = props.handler;

        // request information about the specified product item.
        fetchPostRequest("products/info", {id: this.product})
        .then(response => {
            if (response.code == 200)
            {
                this.setState({product: response.product, error: null});
            }
            else if (response.code == 2) 
            {
                this.setState({product: null, error: "Somehow this product doesn't exist?"});
            }
            else this.setState({product: null, error: "Unexpected error occurred."});
        })
        .catch(() => {
            this.setState({product: null, error: "Unexpected error occurred."});
        });

        this.state = {product: null, error: null, quantity: 1, currentImage: 0};
    }

    handleChangeQuantity = (event) => {
        this.setState({quantity: event.target.value});
    }

    handleAddToCart = () => {
        this.handler(this.product, this.state.quantity);
    }

    handleReduceQuantity = () => {
        // dont let people add a negative amount of items to their cart.
        // additionally checked on the server because never trust the client but
        // this will improve user experience.
        let quantity = this.state.quantity - 1;
        if (quantity < 1) quantity = 1;

        this.setState({ quantity: quantity });
    }

    handleIncreaseQuantity = () => {
        // check product.maxOrder to make sure that the client can actually order this amount of
        // product. also checked on serverside because there's a chance that the available amount
        // of product has changed since the initial request was sent. 
        let quantity = this.state.quantity + 1;
        if (quantity > this.state.product.maxOrder) quantity = this.state.product.maxOrder;

        this.setState({ quantity: quantity });
    }

    handleNextImage = () => {
        let index = this.state.currentImage + 1;
        if (index == this.state.product.images.length) index = 0;

        this.setState({ currentImage: index });
    }

    render() {
        if (this.state.product === null) return null; // if the product has not yet been loaded, don't render anything yet.

        let primary = e(GenericImage, { area: "customer", process: true, url: this.state.product.primaryImageID, tabIndex: 0}); // generate the product's primary image.
        let content;
        if (this.state.error != null) content = e(GenericError, { area: "customer", text: this.state.error }); // if we have an error just display that in the popup window
        else {
            let title = e(GenericText, { // title gets the top space of the description box
                area: "customer", type: "title", text: this.state.product.name, gridArea: "title"
            });
            let description = e(GenericText, { // description appears off to the side
                area: "customer", description: false, text: this.state.product.description.replaceAll(";", " "),
                gridArea: "description"
            });
            let price = e(GenericText, { // price is directly underneath the image
                area: "customer", text: "\u00A3" + this.state.product.price,
                gridArea: "price"
            });

            let image = e(GenericImage, { // takes up a 2x2 space.
                area: "customer",
                url: this.state.product.images[this.state.currentImage],
                process: true,
                handleClick: this.handleNextImage,
                gridArea: "image"
            });

            let buttonReduce = e(GenericButton, {
                area: "customer-product", text: "-", click: this.handleReduceQuantity
            });
            let buttonIncrease = e(GenericButton, {
                area: "customer-product", text: "+", click: this.handleIncreaseQuantity
            });

            let buttonBuy = e(GenericButton, {
                area: "customer-product", text: "Add to cart", click: this.handleAddToCart,
                gridArea: "buy"
            });

            let display = e("div", { className: "customer-product-quantity-number" }, this.state.quantity);
            let quantity = e("div", 
            { className: "customer-product-quantity", style: {
                display: "flex", justifyContent: "space-between", gridArea: "quantity"
            }},
             buttonReduce, display, buttonIncrease);

            content = [title, description, price, image, quantity, buttonBuy];
        }
        // encapsulate all content within a display: grid object.
        let grid = e("div", { className: "customer-product-description" }, content);
        return e("div", { key: "product-" + this.product, className: "customer-product", tabIndex: 0}, primary, grid);
    }
}

/*

class to display the checkout button below the cart
also displays cart details
*/
class CustomerSidebarCartPurchase extends React.Component {
    constructor(props) {
        super(props);

        this.total = props.total;
        this.purchaseHandler = props.purchaseHandler;
    }

    handlePurchase = () => {
        this.purchaseHandler();
    }

    render() {
        let subtotal = e(GenericText, { area: "customer-checkout", text: "Subtotal: \u00A3" + this.total });
        let shipping = e(GenericText, { area: "customer-checkout", text: "Est. Shipping: \u00A34.00" });

        let buttonCheckout = e(GenericButton, { area: "customer-checkout", text: "Checkout", click: this.handlePurchase, disabled: false });
        return e("div", {
            style: {
                display: "flex",
                justifyContent: "flex-start",
                flexFlow: "column nowrap",
                height: "20%",
                minHeight: "200px",
                width: "100%",
                borderTop: "2px solid darkgray",
                paddingTop: "5px"
            }
        }, subtotal, shipping, buttonCheckout);
    }
}

/*
holds and handles the cart items

*/
class CustomerSidebarCart extends React.Component {
    constructor(props) {
        super(props);

        this.title = e("div", {className: "customer-title-container"}, e(GenericText, {area: "customer", type: "title", text: "Your Cart"}));
        this.token = props.token;
        this.uid = props.uid;
        this.user = props.user;
        this.purchaseHandler = props.purchaseHandler;

        fetchPostRequest("cart/get", {
            token: this.token,
            id: this.uid
        })
            .then(response => {

                if (response.status == 200) {
                    this.setState({ cart: response.cart, cost: response.total, error: null });
                }
                else if (response.status == 204) {
                    this.setState({ cart: null, error: "Your cart is currently empty!" });
                }
                else if (response.status == 403) {
                    this.setState({ cart: null, error: "Please log in." });
                }
                else if (response.status == 500 || response.status == 204) {
                    this.setState({ cart: null, error: "Your cart is empty."});
                }
                else this.setState({ cart: null, error: "Unexpected error occurred." });
            })
            .catch(() => {
                this.setState({ cart: null, error: "Unexpected error occurred." });
            });

        this.state = { cart: null, cost: 0, error: null, selected: null};
    }

    selectHandler = (id) => {
        this.setState({selected: id});
    }

    render() {
        let cart = [];
        if (this.state.error != null) cart = e(GenericError, {text: this.state.error});
        else if (this.state.cart == null) cart = e(GenericText, {area: "customer", text: "Loading cart.."});
        else {
            let items = []

            let sortedCart = sortCart(this.state.cart);

            for (let c in sortedCart)
            {
                let item = sortedCart[c];
                let sel = item.product.id == this.state.selected;
                items.push(e(CustomerSidebarCartItem, {item: item, selected: sel, selectHandler: this.selectHandler}));
            }

            cart = e("div", { id: "customer-screen-cart"}, items);
        }

        
        let purchase = e(CustomerSidebarCartPurchase, { token: this.token, uid: this.uid, total: this.state.cost, purchaseHandler: this.purchaseHandler, key: "purchasing-" + this.state.cost});

        return e("div", { id: "customer-screen-sidebar-container", className: "customer-sidebar"}, this.title, cart, purchase);
    }
}

class CustomerSidebarCartItem extends React.Component {
    constructor(props) {
        super(props);

        this.item = props.item;
        this.product = this.item.product;
        this.quantity = this.item.quantity;
        this.selectHandler = props.selectHandler;
        this.deleteHandler = props.deleteHandler;
        this.selected = props.selected;
    }

    select = () => {
        this.selectHandler(this.product.id);
    }

    render() {
        let textName = e(GenericText, { area: "customer", text: this.product.name + " " + this.product.suffix });

        let val = this.product.price * this.quantity;
        val = val * 100;
        val = Math.round(val);
        val = val / 100;
        let textPrice = e(GenericText, { area: "customer", text: "\u00A3" + val });
        let textQuantity = e(GenericText, { area: "customer", text: "- x" + this.quantity });

        let info = e("div", {className: "customer-cart-item-info-container"}, textPrice, textQuantity);

        let cl = "customer-cart-item";
        if (this.props.selected) cl += "-selected";

        return e("div", {key: this.product.name + "-cart-item", className: cl, onClick: this.select}, textName, info);
    }
}
/*

class which holds the filter category objects and also manages sending filter id lists to the product grid

*/
class CustomerSidebarFilter extends React.Component {
    constructor(props) {
        super(props);

        this.title = e(GenericText, { area: "customer", type: "title", text: "Filters" });
        this.updateGridHandler = props.updateGridHandler;
        this.state = {filters: null, error: false, selected: {}, hash: ""};

        this.collectCategories({});
    }

    collectCategories(arr) {
        let sel = [];
        for (let s in arr) {
            let list = arr[s];
            for (let i in list)
            {
                sel.push(list[i]);
            }
        }
        fetchPostRequest("filter/categories/get", {
            selected: sel
        })
        .then(response => {
            if (response.code == 200) {
                let hash = cyrb53("" + arr, 420);
                this.updateGridHandler(sel);
                this.setState({filters: response.categories, selected: arr, hash: hash});
            }
            else this.setState({error: true});
        })
        .catch(() => {this.setState({error: true});});
    }

    handleSelected = (nom, values) => {
        let selected = this.state.selected;
        selected[nom] = values;

        this.collectCategories(selected);
    }

    render() 
    {
        let inputs = null;
        if (this.state.error) inputs = e(GenericError, { text: "Something went wrong!" });
        else if (this.state.filters == null) inputs = e(GenericText, { area: "customer", text: "Loading filters...", type: "title" });
        else {
            inputs = [];

            for (let c in this.state.filters)
            {
                inputs.push(e(CustomerSidebarFilterCategory, {category: this.state.filters[c], handler: this.handleSelected, key: this.state.hash + "-" + this.state.filters[c].category}));
            }
        }
        return e("form", {id: "customer-screen-filter", className: "customer-sidebar"}, this.title, inputs);
    }
}
// filter category, displays related attributes
class CustomerSidebarFilterCategory extends React.PureComponent {
    constructor(props) {
        super(props);

        this.category = props.category;
        this.handler = props.handler;
    
        this.state = {
            selected: []
        };
    }

    handleSelect = (value) => {
        let array = this.state.selected;
        let index = array.indexOf(value);

        if (index == -1) array.push(value);
        else array.splice(index, 1);

        this.handler(this.category.category, array);
        this.setState({selected: array});
    }

    render() {
        let attributes = [];
        for (let a in this.category.attributes) {
            attributes.push(e(CustomerSidebarFilterAttribute, {text: this.category.attributes[a], value: this.category.ids[a], key: "a-" + this.category.ids[a], handler: this.handleSelect}));
        }

        return e("div", {className: "customer-filter-container", tabIndex: 0}, e("p", null, this.category.category), e("div", {className: "customer-filter-box"}, attributes));
    }
}

class CustomerSidebarFilterAttribute extends React.PureComponent {
    constructor(props) {
        super(props);

        this.value = props.value;
        this.text = props.text;

        this.handler = props.handler;
    }

    handleChange = () => {
        this.handler(this.value);
    }

    render() {
        return e(GenericInput, {area: "customer-filter", text: this.text, type: "checkbox", handleChange: this.handleChange, containMax: true});
    }
}

/*

handles everything to do with the user before they access their account
also handles the signup process
*/
class LoginMenu extends React.Component {
    constructor(props) {
        super(props);

        this.closeHandler = props.closeHandler;
        this.loginHandler = props.loginHandler;
        this.screenDimmer = e("div", {id: "login-dimmer"});
        this.show = props.show;
        this.closeButton = e("div", {id: "login-button-close", className: "login-button-close", onClick: this.handleClickClose});
        this.closeButton = e("div", {id: "login-container-button-close"}, this.closeButton);
        this.state = {menu: "INDEX", registeringEmail: null};
    }

    // a binded function to the login [email] button
    handleClickLogin = () => {
        this.setState({menu: "LOGIN"});
    }
    handleClickSignup = () => {
        this.setState({menu: "SIGNUP_INDEX"});
    }
    handleClickClose = () => {
        this.closeHandler();
    }

    handleClickResetPassword = (email) => {
        this.setState({menu: "RESET_PASSWORD_EMAIL", registeringEmail: email});
    }

    // middleman function to hide this element upon login. 
    handleLoginAttempt = (email, password) => {
        this.loginHandler(email, password);
    }

    handleClickSignupEmail = () => {
        this.setState({menu: "SIGNUP_EMAIL"});
    }
    handleClickSignupVerify = () => {
        this.setState({menu: "SIGNUP_VERIFY", registeringEmail: null});
    }

    handleSignupAttempt = (email, password, confirm) => {
        fetchPostRequest("register/initial", {
            email: email,
            password: password, 
            confirm: confirm
        }) 
        .then(response => {
            if (response.code == 0) {
                this.setState({menu: "SIGNUP_VERIFY", registeringEmail: email});
            }
        })
        .catch(() => {
            
        })
    }

    handleVerificationAttempt = (email, code) => {
        fetchPostRequest("register/verify", {
            email: email,
            code: code
        })
         
        .then(response => {
            if (response.code == 0) {
                this.setState({menu: "LOGIN", registeringEmail: email});
            }
        })
        .catch(() => {

        })
    }

    handleResetAttempt = (email) => {
        fetchPostRequest("user/password/reset", {
            email: email
        })
         
        .then(response => {
            if (response.code == 0) this.setState({menu: "RESET_PASSWORD_VERIFY", registeringEmail: email})
        })
        .catch(() => {

        })
    }
    handleResetVerificationAttempt = (email, code, password) => {
        fetchPostRequest("user/password/verify", {
            email: email,
            code: code,
            password: password
        })
         
        .then(response => {
            if (response.code == 0) this.setState({menu: "RESET_PASSWORD_DONE", registeringEmail: null});
        })
    }


    render() {
        let contents; // holds the contents of the DIV.

        // This determines what menu we would like to show. The index menu
        // is defined in this class, whereas more specific menus are defined in
        // their own subclasses to ensure readability.
        if (!this.show) {
            return null; // This means that the menu should not be open.
        }
        if (this.state.menu === "INDEX") {
            // Main screen that you can access most others from.
            contents = [
                e(GenericText, {area: "login", text: "Log-in", type: "title"}),
                e(GenericText, {area: "login", text: "An account will allow you to save carts and checkout!"}),
                e(GenericButton, {area: "login", text: "Login with Email", click: this.handleClickLogin}),
                e(GenericButton, {area: "login", text: "Login with Facebook", click: null, disabled: true}),
                e(GenericButton, {area: "login", text: "Register", click: this.handleClickSignup})
            ];
        }
        else if (this.state.menu === "LOGIN") {
            contents = e(LoginMenuLogin, {resetPasswordHandler: this.handleClickResetPassword, loginHandler: this.handleLoginAttempt, email: this.state.registeringEmail, key: "login-login"});
        }
        else if (this.state.menu === "SIGNUP_INDEX") {
            contents = [
                e(GenericText, {area: "login", text: "Register", type: "title"}),
                e(GenericText, {area: "login", text: "You can create an account using several methods, although Facebook is recommended."}),
                e(GenericButton, {area: "login", text: "Register using Email", click: this.handleClickSignupEmail}),
                e(GenericButton, {area: "login", text: "Register using Facebook", click: null, disabled: true}),
                e(GenericButton, {area: "login", text: "Finish registration using code", click: this.handleClickSignupVerify}),
            ];
        }
        else if (this.state.menu === "SIGNUP_EMAIL") {
            contents = e(LoginMenuSignupEmail, {signupHandler: this.handleSignupAttempt, key: "login-signup-email"});
        }
        else if (this.state.menu === "SIGNUP_VERIFY") {
            contents = e(LoginMenuSignupCode, {verifyHandler: this.handleVerificationAttempt, registeringEmail: this.state.registeringEmail, key: "login-signup-code"});
        }
        else if (this.state.menu === "RESET_PASSWORD_EMAIL") {
            contents = e(LoginMenuResetPasswordEmail, {resetHandler: this.handleResetAttempt, email: this.state.registeringEmail});
        }
        else if (this.state.menu === "RESET_PASSWORD_VERIFY") {
            contents = e(LoginMenuResetPasswordVerify, {verifyHandler: this.handleResetVerificationAttempt, email: this.state.registeringEmail});
        }
        else if (this.state.menu === "RESET_PASSWORD_DONE") {
            contents = e(LoginMenuResetPasswordDone, {moveHandler: this.handleClickLogin});
        }
        else if (this.state.menu === "FACEBOOK_REDIRECT") {

        }
        else if (this.state.menu === "HIDDEN") {
            // If we're in this menu we don't want to show anything, so return null.
            return null;
        }

        // assemble the menu.
        return e("div", {key: this.state.menu}, e("div", {className: "login-container"}, this.closeButton, contents), this.screenDimmer);
     }
}

class LoginMenuLogin extends React.Component {
    constructor(props) {
        super(props);

        this.resetPasswordHandler = props.resetPasswordHandler;
        this.loginHandler = props.loginHandler;

        // First thing using the new genericinput class
        this.inputEmail = e(GenericInput, {area: "login", text: "Email", handleInput: this.handleInputEmail, contain: true});
        this.inputPassword = e(GenericInput, {area: "login", text: "Password", handleInput: this.handleInputPassword, contain: true, type: "password"});

        this.state = {
            email: props.email, password: null
        };
    }

    // when a user types in an email address, change the stored value.
    handleInputEmail = (event) => {
        this.setState({email: event.target.value});
    }
    handleInputPassword = (event) => {
        this.setState({password: event.target.value});
    }

    handleClickResetPassword = () => {
        this.resetPasswordHandler(this.state.email);
    }

    handleLoginAttempt = () => {
        if (this.state.email == null || this.state.password == null) return; // If either property is false then there is no chance of a successful login.
        this.loginHandler(this.state.email, this.state.password); // call the login handler with the appropriate properties.
    }


    render() {
        let resetPassword = e("a", {id: "login-reset-password", className: "login-text", onClick: this.handleClickResetPassword}, "Reset Password?");
        resetPassword = e("div", {className: "login-input-block", id: "login-form-login-reset-password", key: "reset-password"}, "", resetPassword);

        let loginButton = e(GenericButton, {area: "login", text: "Start shopping!", click: this.handleLoginAttempt, submitter: true});

        // finalise element
        return [e(GenericText, {area: "login", type: "title", text: "Login"}), this.inputEmail, this.inputPassword, resetPassword, loginButton];
    }
}

/*
pre-verification using email code
where the new user inputs their details

*/
class LoginMenuSignupEmail extends React.Component {
    constructor(props) {
        super(props);

        this.signupHandler = props.signupHandler;
        this.inputEmail = e(GenericInput, {area: "login", contain: true, handleInput: this.handleInputEmail, text: "Email"});
        this.inputPassword = e(GenericInput, {area: "login", contain: true, handleInput: this.handleInputPassword, text: "Password", type: "password"});
        this.inputConfirm = e(GenericInput, {area: "login", contain: true, handleInput: this.handleInputConfirm, text: "Confirm", type: "password"});
        this.textTitle = e(GenericText, { area: "login", text: "Register", type: "title"});

        this.state = {
            email: null,
            password: null,
            confirm: null,
            error: null,
            pstrength: null
        }
    }

    handleInputEmail = (event) => {
        this.setState({email: event.target.value});
    }

    // a very bad password strength checker
    handleInputPassword = (event) => {
        let password = event.target.value;
        let str = 0;

        if (password.length < 8) str = 1;
        else if (password === "password") str = -1;
        else if (password.length < 11) str = 2;
        else str = 3;

        this.setState({password: event.target.value, pstrength: str});
    }
    handleInputConfirm = (event) => {
        this.setState({confirm: event.target.value});
    }

    handleSignup = () => {
        if (this.state.email == null || this.state.password == null || this.state.confirm == null) this.setState({error: "Fill in all boxes!"});
        else if (this.state.password != this.state.confirm) this.setState({error: "Passwords don't match!"});
        else if (this.state.pstrength == -1) this.setState({error: "Dumb password, please change."});
        else if (this.state.pstrength == 1) this.setState({error: "Password too short!"});
        else {
            this.signupHandler(this.state.email, this.state.password, this.state.confirm);
        }
    }

    render() {
        let text;
        if (this.state.pstrength == -1) text = "This password stinks.";
        else if (this.state.pstrength == 1) text = "This password is too short";
        
        let strength = e(GenericText, {area: "login", colour: "orange", text: text});
        let buttonRegister = e(GenericButton, {area: "login", text: "Register Account!", click: this.handleSignup});

        return [
            this.textTitle,
            this.inputEmail,
            this.inputPassword,
            this.inputConfirm,
            strength,
            buttonRegister,
            e(GenericError, { text: this.state.error })
        ];
    }
}

/*
post verification handling of registration
*/
class LoginMenuSignupCode extends React.Component {
    constructor(props) {
        super(props);
        this.verifyHandler = props.verifyHandler;
        this.inputEmail = e(GenericInput, {area: "login", contain: true, value: props.registeringEmail, handleInput: this.handleInputEmail, text: "Email"});
        this.inputCode = e(GenericInput, { area: "login", contain: true, handleInput: this.handleInputCode, text: "Code" });
        this.textTitle = e(GenericText, { area: "login", text: "Finish Registration", type: "title" });
        this.state = {email: props.registeringEmail, code: null};
    }

    handleInputEmail = (event) => {
        this.setState({email: event.target.value});
    }
    handleInputCode = (event) => {
        this.setState({code: event.target.value});
    }
    handleClickVerify = () => {
        this.verifyHandler(this.state.email, this.state.code);
    }

    render() {
        return [
            this.textTitle,
            this.inputEmail,
            this.inputCode,
            e(GenericButton, { area: "login", click: this.handleClickVerify, type: "submit", text: "Verify your account!" })
        ];
    }
}
// how a user can reset their password. this is pre-verification
class LoginMenuResetPasswordEmail extends React.Component {
    constructor(props) {
        super(props);

        this.resetHandler = props.resetHandler;
        this.inputEmail = e(GenericInput, {area: "login", contain: true, value: props.email, handleInput: this.handleInputEmail, text: "Email"});
        this.button = e(GenericButton, { area: "login", text: "Send Code", click: this.handleClickReset });
        this.textTitle = e(GenericText, { area: "login", text: "Reset Password", type: "title" });
        this.textDesc = e(GenericText, {
            area: "login",
            text: "Please enter the email attached to your account here and we'll send you an email with a reset code. Please note that this only works with website accounts."
        });

        this.state = {email: props.email};
    }

    handleInputEmail = (event) => {
        this.setState({email: event.target.value});
    }
    handleClickReset = () => {
        if (this.state.email != null) this.resetHandler(this.state.email);
    }

    render() {
        return [
            this.textTitle,
            this.textDesc,
            this.inputEmail,
            this.button
        ];
    }
}
// this is where the user can use their verification code to reset their password on their WEB account
class LoginMenuResetPasswordVerify extends React.Component {
    constructor(props) {
        super(props);

        this.inputEmail = e(GenericInput, {area: "login", contain: true, text: "Email", handleInput: this.handleInputEmail});
        this.inputCode = e(GenericInput, {area: "login", contain: true, text: "Code", handleInput: this.handleInputCode});
        this.inputPassword = e(GenericInput, {area: "login", contain: true, text: "Password", handleInput: this.handleInputPassword, type: "password"});
        this.inputConfirm = e(GenericInput, {area: "login", contain: true, text: "Confirm", handleInput: this.handleInputConfirm, type: "password"});
        this.buttonReset = e(GenericButton, { area: "login", text: "Reset", click: this.handleClickReset });
        this.textTitle = e(GenericText, { area: "login", text: "Reset Password", type: "title" });
        this.textInfo = e(GenericText, { area: "login", text: "There should be a 8-digit reset code in your inbox - make sure you check your spam folder!"});

        this.verifyHandler = props.verifyHandler;
        this.state = {
            email: props.email,
            code: null,
            password: null,
            confirm: null,
            error: null
        }
    }

    handleInputEmail = (event) => {
        this.setState({email: event.target.value});
    }
    handleInputCode = (event) => {
        this.setState({code: event.target.value});
    }
    handleInputPassword = (event) => {
        this.setState({password: event.target.value});
    }
    handleInputConfirm = (event) => {
        this.setState({confirm: event.target.value});
    }
    handleClickReset = () => {
        if (this.state.password != this.state.confirm) this.setState({error: "Passwords don't match!"});
        else this.verifyHandler(this.state.email, this.state.code, this.state.password);
    }

    render() {
        return [
            this.textTitle,
            this.textInfo,
            this.inputEmail,
            this.inputCode,
            this.inputPassword,
            this.inputConfirm,
            this.buttonReset,
            e(GenericError, { text: this.state.error })
        ];
    }
}
// confirmation window. no processing
class LoginMenuResetPasswordDone extends React.Component {
    constructor(props) {
        super(props);

        this.textTitle = e(GenericText, { area: "login", text: "Reset Password", type: "title" });
        this.textInfo = e(GenericText, { area: "login", text: "Your new password has been set! Use it to log into your account from now on."});

        this.buttonDone = e(GenericButton, {area: "login", text: "Login!", click: props.moveHandler});
    }

    render() {
        return [
            this.textTitle,
            this.textInfo,
            this.buttonDone
        ];
    }
}

class AdminScreen extends React.Component {
    constructor(props) {
        super(props);

        this.openAdminHandler = props.openAdminHandler;
        this.openAccountHandler = props.openAccountHandler;
        this.user = props.user;
        this.state = {
            screen: "OVERVIEW"
        };
    }

    handleChangeScreen(screen) {
        this.setState({screen: screen});
    }
    handleSwitchToOverview = () => {
        this.handleChangeScreen("OVERVIEW");
    }
    handleSwitchToProducts = () => {
        this.handleChangeScreen("PRODUCTS");
    }
    handleSwitchToImages = () => {
        this.handleChangeScreen("IMAGES");
    }
    handleSwitchToStock = () => {
        this.handleChangeScreen("STOCK")
    }
    handleSwitchToOrders = () => {
        this.handleChangeScreen("ORDERS")
    }

    render() {
        let topbar = e(Topbar, {user: this.user, screen: "ADMIN", adminHandler: this.openAdminHandler, accountHandler: this.openAccountHandler, inAdminScreen: true});

        let contents = [];
        let noPadding = false;
        switch (this.state.screen) {
            default:
            case "OVERVIEW":
                contents = e(AdminWindowOverview, { user: this.user });
                break;
            case "PRODUCTS":
                contents = e(AdminWindowProducts, {user: this.user});
                break;
            case "STOCK":
                contents = e(AdminStock, { user: this.user });
                break;
            case "ORDERS":
                contents = e(AdminWindowOrders, { user: this.user });
                noPadding = true;
                break;
            case "IMAGES":
                contents = e(AdminWindowImages, {user: this.user});
                noPadding = true;
                break;
        }

        let buttons = [];
        buttons.push(e(GenericButton, { area: "admin-menu", text: "Overview", click: this.handleSwitchToOverview }));
        buttons.push(e(GenericButton, { area: "admin-menu", text: "Products", click: this.handleSwitchToProducts }));
        buttons.push(e(GenericButton, { area: "admin-menu", text: "Stock", click: this.handleSwitchToStock }));
        buttons.push(e(GenericButton, { area: "admin-menu", text: "Orders", click: this.handleSwitchToOrders }));
        buttons.push(e(GenericButton, { area: "admin-menu", text: "Image Library", click: this.handleSwitchToImages }));

        let menu = e("div", {id: "admin-menu"}, buttons);

        let window = e("div", {id: "admin-window"}, contents);
        if (noPadding) window = e("div", {id: "admin-window-nomargin"}, contents);

        let container = e("div", {id: "admin-container"}, menu, window);
        return e("div", null, topbar, container);
    }
}

class AdminWindowOverview extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.state = {
            stats: null, error: false
        };

        fetchPostRequest("stats", {
            token: this.user.token,
            id: this.user.id
        }).then(response => {
            if (response.status == 200) {
                this.setState({ stats: response.stats, error: false });
            }
            else this.setState({ error: true });
        }).catch(() => {
            this.setState({ error: true });
        })
    }

    render() {
        if (this.state.error) return e(GenericError, { text: "Error occurred whilst loading statistics!" });
        else if (this.state.stats == null) return e(GenericText, { text: "Loading stats...", type: "title" });
        else {
            let title = e(GenericText, { text: "Business Overview", type: "title" });
            let stats = e(GenericText, { text: this.state.stats, description: true });

            return [title, stats];
        }
    }
}
// displays an order list and then an order management screen
class AdminWindowOrders extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.state = {
            orders: null,
            selected: null,
            refreshers: 0,
            error: false
        };

        this.handleRefresh();
    }

    handleRefresh = () => {
        fetchPostRequest("orders/load", {
            token: this.user.token,
            id: this.user.id
        }).then(response => {
            if (response.status == 200) {
                this.setState({ orders: response.orders, refreshers: ++this.state.refreshers, selected: null, error: false});
            }
            else this.setState({error: true})
        })
            .catch(() => {
                this.setState({ error: true })
            });
    }

    handleSelect = (selecting) => {
        for (let i = 0; i < this.state.orders.length; i++) {
            if (this.state.orders[i].id == selecting) this.setState({selected: i});
        }
    }

    render() {
        if (this.state.error) return e(GenericError, { text: "Something went wrong!" });

        let selector;
        if (this.state.orders == null) selector = e(GenericText, { area: "admin", text: "Orders are loading..." });
        else selector = e(AdminWindowOrdersSelector, { orders: this.state.orders, selectHandler: this.handleSelect, key: "awos-" + this.state.refreshers });

        let viewer;
        if (this.state.selected == null) viewer = e(GenericText, { area: "admin", text: "Select something!" });
        else viewer = e(AdminWindowOrdersViewer, { order: this.state.orders[this.state.selected], user: this.user, key: this.state.selected, handleRefresh: this.handleRefresh });

        return e("div", { id: "admin-orders-grid", key: "awo-" + this.state.refreshers}, selector, viewer);
    }
}

class AdminWindowOrdersSelector extends React.Component {
    constructor(props) {
        super(props);

        this.selectHandler = props.selectHandler;
        this.orders = props.orders;
    }

    render() {
        let orders = [];
        // populate the order list with items
        for (let i = 0; i < this.orders.length; i++) {
            orders.push(e(AdminWindowOrdersSelectorItem, { selectHandler: this.selectHandler, order: this.orders[i] }));
        }

        return e("div", { id: "admin-orders-selector" }, orders);
    }
}

class AdminWindowOrdersSelectorItem extends React.PureComponent {
    constructor(props) {
        super(props);

        this.order = props.order;
        this.selectHandler = props.selectHandler;
    }

    handleSelect = () => {
        this.selectHandler(this.order.id);
    }

    render() {
        let paid = this.order.hasPaid;
        let posted = this.order.hasPosted;

        let colour = "red";
        if (!paid && posted) colour = "orange";
        else if (paid && !posted) colour = "blue";
        else if (posted) colour = "green";

        let buttonOrder = e(GenericButton, { area: "admin-orders-selectable", text: this.order.orderName, colour: colour, click: this.handleSelect });

        return buttonOrder;
    }
}


class AdminWindowOrdersViewer extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.order = props.order;
        this.handleRefresh = props.handleRefresh;
    }

    handlePaid = () => {
        fetchPostRequest("orders/paid", {
            token: this.user.token,
            id: this.user.id,
            order: this.order.id
        })
            .then(response => {
            if (response.status == 200) {
                this.handleRefresh();
            }
        })
            .catch(() => { });
    }

    handlePosted = () => {
        fetchPostRequest("orders/posted", {
            token: this.user.token,
            id: this.user.id,
            order: this.order.id
        })
            .then(response => {
                if (response.status == 200) {
                    this.handleRefresh();
                }
            })
            .catch(() => { });
    }

    render() {
        let orderItems = [];
        for (let i = 0; i < this.order.items.length; i++) {
            orderItems.push(e(GenericText, { area: "admin", text: this.order.items[i] }));
        }
        let items = e("div", { id: "admin-orders-viewer-items", key: this.order.id }, orderItems);
        let instructionTitle = e(GenericText, {area: "admin", text: "Stock collection:", type: "subtitle"});
        let instructions = e(GenericText, {area: "admin", gridArea: "orderInstructions", text: this.order.instructions, description: true});
        let name = e(GenericText, { area: "admin", gridArea: "name", text: this.order.customerName });
        let address = e(GenericText, { area: "admin", gridArea: "address", text: this.order.customerAddress });

        let details = e(GenericText, {
            area: "admin", gridArea: "orderDetails",
            text: "Paid for: " + (this.order.hasPaid ? "Yes" : "No") + " | Posted: " + (this.order.hasPosted ? "Yes" : "No")
        });

        let buttonPaid = e(GenericButton, { area: "admin-orders", gridArea: "buttonPaid", text: "Press when paid for", click: this.handlePaid });
        let buttonPosted = e(GenericButton, { area: "admin-orders", gridArea: "buttonPosted", text: "Press when order has been posted", click: this.handlePosted });

        return e("div", {id: "admin-orders-viewer"}, items, instructionTitle, instructions, name, address, details, buttonPaid, buttonPosted);
    }
}

class AdminWindowImages extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;

        this.state = {gridKey: 0, selected: null, error: null};
    }

    handleSelect = (selected) => {
        this.setState({selected: selected});
    }

    handleSetPrimary = (binding) => {
        if (this.state.selected === null) this.setState({ error: "Nothing selected" });

        fetchPostRequest("images/bind/primary", {
            token: this.user.token,
            id: this.user.id,
            imageID: this.state.selected,
            bindingID: binding
        })
            .then(response => {
                if (response.status == 200) {

                }
            })
            .catch(() => { });
    }

    handleAddImage = (binding) => {
        if (this.state.selected === null) this.setState({ error: "Nothing selected" });

        fetchPostRequest("images/bind/secondary", {
            token: this.user.token,
            id: this.user.id,
            imageID: this.state.selected,
            bindingID: binding
        })
            .then(response => {
                if (response.status == 200) {

                }
            })
            .catch(() => { });
    }


    handleRerender = () => {
        this.setState({gridKey: this.state.gridKey + 1});
    }

    render() {
        let imageGrid = e(AdminWindowImagesGrid, {key: this.state.gridKey, handler: this.handleSelect});
        let managerBar = e(AdminWindowImagesManager, {user: this.user, handler: this.handleRerender, setHandler: this.handleSetPrimary, addHandler: this.handleAddImage});

        return e("div", {id: "admin-images"}, imageGrid, managerBar);
    }
}
class AdminWindowImagesGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {ids: null, error: null, selected: -1};

        this.handler = props.handler;

        fetchGetRequest("images/request/list")
        .then(response => {
            if (response.code == 200) {
                this.setState({ids: response.ids, error: null});
            }
            else this.setState({error: "Failed to fetch images."});
        })
        .catch(() => {this.setState({error: "Failed to fetch images."})});
    }

    handleSelect = (id) => {
        this.setState({selected: id});
        this.handler(id);
    }

    render() {
        let content = null;
        if (this.state.error == null) {
            if (this.state.ids == null) content = e(GenericText, {area: "admin", text: "Loading images..."});
            else {
                content = [];
                for (let i in this.state.ids) {
                    let id = this.state.ids[i];

                    let selected = id === this.state.selected;
                    content.push(e(AdminWindowImagesGridImage, {id: id, handler: this.handleSelect, key: id + "-" + selected, selected: selected}));
                }
            }
        }
        else content = e(GenericError, {text: this.state.error});
        return e("div", {id: "admin-images-grid"}, content);
    }
}

class AdminWindowImagesGridImage extends React.Component {
    constructor(props) {
        super(props);

        this.id = props.id;
        this.handler = props.handler;
        this.selected = props.selected;
    }

    handleClick = () => {
        this.handler(this.id);
    }

    render() {
        let area = "admin";
        if (this.props.selected) area = "admin-selected";
        return e(GenericImage, {area: area, url: this.id, process: true, handleClick: this.handleClick});
    }
}

class AdminWindowImagesManager extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.handler = props.handler;
        this.setHandler = props.setHandler;
        this.addHandler = props.addHandler;
        
        this.ref = React.createRef();
        this.inputSubmit = e(GenericInput, {area: "admin", type: "submit", text: "Upload images", disabled: false});
        this.state = {products: null, templates: null, binding: null};

        fetchPostRequest("products/collect", {
            token: this.user.token,
            id: this.user.id
        })
        .then(response => {
            if (response.code == 0) {
                this.setState({products: response.products, templates: response.templates});
            }
            else this.setState({products: "error", templates: "error"});
        })
        .catch(() => {this.setState({products: "error", templates: "error"});});
    }



    handleUpload = (event) => {
        event.preventDefault();

        let formData = new FormData();
        for (let i = 0; i < this.ref.current.files.length; i++) {
            let file = this.ref.current.files.item(i);
            formData.append("image", file, "file" + i);
        }

        fetchPostRequestFile("images/pump/raw", formData)
        .then(response => {
            if (response.code == 200) {
                // woo, the file has been accepted.
                // to actually add the file to the database, we must send an authorization request
                // with an acceptable admin session token. 

                return fetchPostRequest("images/pump/turn", {
                    key: response.requestToken,
                    token: this.user.token,
                    id: this.user.id
                });
            }
        })
        .then(response => {
            if (response.code == 200) this.handler();
        })
    }

    handleChangeBinding = (event) => {
        this.setState({binding: event.target.value});
    }

    handleSetAsPrimary = () => {
        if (this.state.binding === null) return;

        this.setHandler(this.state.binding);
    }

    handleAddImage = () => {
        if (this.state.binding === null) return;

        this.addHandler(this.state.binding);
    }

    render() {
        let inputFile = e("input", {type: "file", name: "image", multiple: true, accept: ".jpg, .jpeg", form: "admin-images-form", ref: this.ref});
        let uploadForm = e("form", {className: "admin-flex-column", id: "admin-images-form", encType: "multipart/form-data", onSubmit: this.handleUpload, target: "_blank"}, inputFile, this.inputSubmit);


        let inputSelection = null;
        if (this.state.products == null || this.state.templates == null) inputSelection = e(GenericText, {area: "admin", text: "Loading..."});
        else if (this.state.products == "error" || this.state.templates == "error") inputSelection = e(GenericError, {area: "admin", text: "Couldn't load bindings"});
        else {
            let products = [];
            for (let p in this.state.products)
            {
                let product = this.state.products[p];
                products.push(e("option", {key: product.name, value: product.bind}, product.name));
            }
            let templates = [];
            for (let t in this.state.templates) {
                let template = this.state.templates[t];
                templates.push(e("option", {key: template.name, value: template.bind}, template.name));
            }

            inputSelection = e("select", 
                {className: "admin-input", form: "admin-form-tag", id: "admin-form-tag-selection", onChange: this.handleChangeBinding},
                e("optgroup", {label: "Products"}, products),
                e("optgroup", {label: "Templates"}, templates)
            );
            inputSelection = [createInputLabel(inputSelection, "Select either a product or a template:"), inputSelection];
        }
        let buttonSetPrimary = e(GenericButton, { area: "admin", text: "Set selected image as primary", click: this.handleSetAsPrimary });
        let buttonAdd = e(GenericButton, { area: "admin", text: "Add selected image to binding", click: this.handleAddImage });

        let linker = e("div", {className: "admin-flex-column"}, inputSelection, buttonSetPrimary, buttonAdd);

        return e("div", {id: "admin-images-bar"}, uploadForm, linker);
    }
}




class AdminWindowProducts extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
    }


    render() {
        let items = [];
        items.push(e(AdminProductViewer, {user: this.user}));
        items.push(e(AdminProductTemplateForm, { user: this.user}));
        items.push(e(AdminProductForm, {user: this.user}));
        items.push(e(AdminSupplierForm, {user: this.user}));
        items.push(e(AdminTagForm, {user: this.user}));
        items.push(e(AdminAttributeForm, {user: this.user}));
        items.push(e(AdminCategoryForm, {user: this.user}));
        
        for (let i in items) items[i] = e("div", {className: "admin-item", key: "adminitem-" + i}, items[i]);
        return items;
    }
}



class AdminProductTemplateForm extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;

        this.title = e(GenericText, {area: "admin", type: "title", text: "Product Template Creator"});
        this.inputName = e(GenericInput, {area: "admin", text: "Product Name", handleInput: this.handleName});
        this.inputDescription = e("textarea", { className: "admin-input", id: "admin-form-template-description", form: "admin-form-template", rows: 6, cols: 27, onInput: this.handleDescription});
        this.inputDescription = [createInputLabel(this.inputDescription, "Product Description"), this.inputDescription];
        this.button = e(GenericButton, {area: "admin", text: "Submit", click: this.handleSubmit});
        
        fetchGetRequest("suppliers")
         
        .then(response => {
            if (response.code == 0) {
                this.setState({suppliers: response.suppliers});
            }
            else this.setState({error: true, suppliers: null});
        })
        .catch(this.setState({error: true, suppliers: null}))

        this.state = {error: false, suppliers: null, name: null, description: null, supplier: null, submitError: false};
    }

    handleSubmit = () => {
        fetchPostRequest("products/templates/update", 
        {
            token: this.user.token,
            id: this.user.id,
            name: this.state.name,
            description: this.state.description,
            supplier: this.state.supplier
        })
         
        .then(response => {
            if (response.code == 0)
            {
                this.setState({submitError: false});
            }
            else this.setState({submitError: true});
        })
        .catch(() => {this.setState({submitError: true});});
    }

    handleName = (event) => {
        this.setState({name: event.target.value});
    }

    handleDescription = (event) => {
        this.setState({description: event.target.value});
    }

    handleSupplier = (event) => {
        this.setState({supplier: event.target.value});
    }

    render() {
        var suppliers = null;
        if (this.state.error) suppliers = e(GenericError, {text: "Failed to fetch supplier data"});
        else if (this.state.suppliers == null) suppliers = e(GenericText, {area: "admin", text: "Loading...."});
        else {
            let bowl = [];
            for (let supplier in this.state.suppliers) {
                let soup = this.state.suppliers[supplier];

                bowl.push(e("option", {value: soup.id}, soup.name));
            }

            suppliers = e("select", {id: "admin-form-template-supplier", className: "admin-input", form: "admin-form-template", onChange: this.handleSupplier}, bowl);
        }

        let suber = null;
        if (this.state.submitError) suber = e(GenericError, {text: "Failed to create template!"});
        return [this.title, this.inputName, this.inputDescription, suppliers, this.button, suber];
    }
}

class AdminProductForm extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        
        this.title = e(GenericText, {area: "admin", type: "title", text: "Product Creator"});
        this.inputCode = e(GenericInput, {area: "admin", text: "Product Code", handleInput: this.handleCodeChange});
        this.inputNameSuffix = e(GenericInput, {area: "admin", text: "Name Suffix", handleInput: this.handleSuffixChange});
        this.inputPrice = e(GenericInput, {area: "admin", text: "Price", handleInput: this.handlePriceChange});
        this.button = e(GenericButton, {area: "admin", text: "Submit", click: this.handleSubmit});

        fetchGetRequest("products/templates/list")
        .then(response => {
            if (response.code == 0)
            {
                this.setState({error: false, templates: response.templates});
            }
            else this.setState({error: true, templates: null});
        })
        .catch(() => {
            this.setState({error: true, templates: null});
        });
        this.state = {templates: null, error: false, submitError: null, template: null, code: null, suffix: null, price: null};
    }

    handleSubmit = () => {
        let setError = null;
        if (this.state.template == null) setError = "No template selected.";
        else if (this.state.code == null) setError = "Please add a code for this product.";
        else if (this.state.price == null) setError = "Please set a price for this product.";
        else {
            fetchPostRequest("products/update", {
                token: this.user.token,
                id: this.user.id,
                template: this.state.template,
                code: this.state.code,
                suffix: this.state.suffix,
                price: this.state.price
            })
             
            .then(response => {
                if (response.code == 0)
                {
                    this.setState({submitError: null});
                }
                else if (response.code == 1)
                {
                    this.setState({submitError: "Somehow you have insufficient permission to do this?"});
                }
                else this.setState({submitError: "Unexpected error occurred!"});
            })
            .catch(() => {this.setState({submitError: "Unexpected error occurred!"});});
        }

        this.setState({submitError: setError});
    }

    handleCodeChange = (event) => {
        this.setState({code: event.target.value});
    }
    handleSuffixChange = (event) => {
        this.setState({suffix: event.target.value});
    }
    handlePriceChange = (event) => {
        this.setState({price: event.target.value});
    }
    handleTemplateChange = (event) => {
        this.setState({template: event.target.value});
    }


    render() {
        let templates = null;
        if (this.state.error) templates = e(GenericError, {text: "Could not load templates!"});
        else if (this.state.templates == null) templates = e(GenericText, {area: "admin", text: "Loading templates..."});
        else {
            let options = [];
            for (let t in this.state.templates) {
                let template = this.state.templates[t];

                options.push(e("option", {value: template.id}, template.name));
            }

            templates = e("select", {className: "admin-input", id: "admin-form-product-templates", form: "admin-form-product", onChange: this.handleTemplateChange}, options);
            templates = [createInputLabel(templates, "Product Template"), templates];
        }

        return [this.title, templates, this.inputCode, this.inputNameSuffix, this.inputPrice, this.button, e(GenericError, {text: this.state.error ? "Error occurred!" : null})];
    }
}

class AdminProductViewer extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;

        this.token = props.token;
        this.uid = props.uid;

        this.title = e(GenericText, {area: "admin", type: "title", text: "Product Viewer"});
        this.state = {products: null, product: null, error: false, noproduct: false};

        fetchGetRequest("products/list") 
        .then(response => {
            if (response.code == 0)
            {
                this.setState({products: response.products});
                this.handleChangeProduct({target: {value: response.products[0].id}});
            }
            else this.setState({products: null, product: null, error: true});
        })
        .catch(() => {this.setState({products: null, product: null, error: true});});

    }

    handleChangeProduct = (event) => {
        let p = event.target.value;
        fetchPostRequest("products/info", {
            id: p
        })
        .then(response => {
            if (response.status == 200) {
                this.setState({product: response.product, noproduct: false});
            }
            else if (response.status == 404) {
                this.setState({product: null, noproduct: true});
            }
        })
        .catch(() => {
            this.setState({product: null, noproduct: true});
        });
    }

    render() {
        let inputProducts = null;
        if (this.state.error) inputProducts = e(GenericError, {text: "Unexpected error occurred whilst loading products!"});
        else if (this.state.products == null) inputProducts = e(GenericText, {area: "admin", text: "Loading products..."});
        else {
            let products = [];
            products.push(e("option", {key: " ", value: " "}, " "));
            for (let p in this.state.products)
            {
                let product = this.state.products[p];
                products.push(e("option", {key: product.name, value: product.id}, product.name));
            }
            inputProducts = e("select", {className: "admin-input", form: "admin-form-viewer", id: "admin-form-viewer-select", key: "sel", onChange: this.handleChangeProduct}, products);
        }

        let selector = e("div", {id: "admin-productviewer-selector"}, inputProducts);
        
        let image = e("img", {id: "admin-productviewer-image", src: "./pictures/no-image.png"});

        let info;
        let supplierInfo;

        if (this.state.noproduct || this.state.product == null) {
            info = e(GenericError, {text: "Product doesn't exist"});
            supplierInfo = null;
        }
        else {
            let product = this.state.product;
            let productName = e(GenericText, {area: "admin", text: product.name + " - " + product.code, type: "subtitle"});
            let productPrice = e(GenericText, {area: "admin", text: "\u00A3" + product.price});
            let productDescription = e(GenericText, {area: "admin", text: product.description, description: true});

            image = e(GenericImage, {url: product.primaryImageID, process: true, area: "admin", gridArea: "image"});

            info = e("div", {id: "admin-productviewer-info", className: "global-columnflex"}, productName, productPrice, productDescription);

            let supplierName = e(GenericText, {area: "admin", text: "Supplied by " + product.supplierName, type: "subtitle"});
            let supplierDescription = e(GenericText, {area: "admin", text: product.supplierDescription, description: true});

            supplierInfo = e("div", {id: "admin-productviewer-supplier", className: "global-columnflex"}, supplierName, supplierDescription);
        }

        return e("div", {id: "admin-productviewer", key: this.state.product === null ? "nothing" : this.state.product.name}, this.title, selector, info, supplierInfo, image);
    }
}

class AdminTagForm extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        
        this.title = e(GenericText, {area: "admin", type: "title", text: "Attribute-Bindable Linker"});
        this.button = e(GenericButton, {area: "admin", text: "Submit", click: this.handleSubmit});

        fetchGetRequest("attributes/list") 
            .then(response => {
                if (response.code != 0) {
                    this.setState({categories: "error"});
                }
                else {
                    this.setState({categories: response.categories});
                }
            }).catch(() => {this.setState({categories: "error"})});

        fetchPostRequest("products/collect", {
            token: this.user.token,
            id: this.user.id
        })
        .then(response => {
            if (response.code == 0) {
                this.setState({products: response.products, templates: response.templates});
            }
            else this.setState({products: "error", templates: "error"});
        })
        .catch(() => {this.setState({products: "error", templates: "error"});});

        this.state = {categories: null, products: null, templates: null, selectedAttribute: null, selected: null, error: null};
    }

    handleSubmit = () => {
        if (this.state.selectedAttribute == null)
        {
            this.setState({error: "Select an attribute first."});
        }
        else if (this.state.selected == null)
        {
            this.setState({error: "Select something to add the tag to."});
        }
        else {
            fetchPostRequest("tags/add", {
                token: this.user.token,
                id: this.user.id,
                attribute: this.state.selectedAttribute,
                linking: this.state.selected
            })
            .then(response => {
                if (response.code == 0) this.setState({error: null});
                else if (response.code == 1) this.setState({error: "Insufficient access to run privileged command."});
                else this.setState({error: "Unexpected error occurred!"});
            })
            .catch(() => {
                this.setState({error: "Unexpected error occurred!"});
            });
        }
    }

    handleChangeAttribute = (event) => {
        this.setState({selectedAttribute: event.target.value});
    }
    handleChangeSelection = (event) => {
        this.setState({selected: event.target.value});
    }

    render() {
        var data = this.state.categories;

        var inputAttribute = null;
        if (data == null)
        {
            inputAttribute = e(GenericText, {area: "admin", text: "Loading attributes..."});
        }
        else if (data == "error") {
            inputAttribute = e(GenericError, {text: "Unexpected error occurred loading attributes!"});
        }
        else
        {
            let options = [];
            for (let c in data)
            {
                let category = data[c];
                let attributes = [];
                for (let a in category.attributes) {
                    attributes.push(e("option", {key: category.attributes[a], value: category.ids[a]}, category.attributes[a]));
                }

                options.push(e("optgroup", {key: category.category, label: category.category}, attributes));
            }

            inputAttribute = e("select", {className: "admin-input", form: "admin-form-tag", id: "admin-form-tag-attributes", onChange: this.handleChangeAttribute}, options);
            inputAttribute = [createInputLabel(inputAttribute, "Attribute"), inputAttribute];
        }

        let inputSelection = null;
        if (this.state.products == null || this.state.templates == null) inputSelection = e(GenericText, {area: "admin", text: "Loading bindables..."});
        else if (this.state.products == "error" || this.state.templates == "error") inputSelection = e(GenericError, {text: "Unexpected error occurred loading bindables!"});
        else {
            let products = [];
            for (let p in this.state.products)
            {
                let product = this.state.products[p];
                products.push(e("option", {key: product.name, value: product.bind}, product.name));
            }
            let templates = [];
            for (let t in this.state.templates) {
                let template = this.state.templates[t];
                templates.push(e("option", {key: template.name, value: template.bind}, template.name));
            }

            inputSelection = e("select", 
                {className: "admin-input", form: "admin-form-tag", id: "admin-form-tag-selection", onChange: this.handleChangeSelection},
                e("optgroup", {label: "Products"}, products),
                e("optgroup", {label: "Templates"}, templates)
            );
            inputSelection = [createInputLabel(inputSelection, "Select either a product or a template:"), inputSelection];
        }
        
        return [this.title, inputAttribute, inputSelection, this.button, e(GenericError, {text: this.state.error})];
    }
}

class AdminAttributeForm extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;

        this.inputAttribute = e(GenericInput, {area: "admin", text: "Attribute Value", handleInput: this.handleChangeAttribute});
        this.buttonSubmit = e(GenericButton, {area: "admin", text: "Submit", click: this.handleSubmit});
        fetchGetRequest("categories") 
            .then(response => {
                if (response.code != 0) {
                    this.setState({categories: null});
                }
                else {
                    this.setState({categories: response.categories, category: response.categories[0].id});
                }
            }).catch(() => {this.setState({categories: null})});
        
        this.title = e(GenericText, {area: "admin", type: "title", text: "Attribute Creator"});

        this.state = {attribute: null, category: null, invalid: false, categories: null};
    }

    handleSubmit = () => {
        fetchPostRequest("attributes/update", {
                token: this.user.token,
                attribute: this.state.attribute,
                category: this.state.category,
                id: this.user.id
        }) 
            .then(response => {
                if (response.code != 0) {
                    this.setState({ invalid: true });
                }
                else {
                    this.setState({ invalid: false });
                }
            }).catch(() => {this.setState({invalid: true});});
    }

    handleChangeAttribute = (event) => {
        this.setState({attribute: event.target.value});
    }
    handleChangeCategory = (event) => {
        this.setState({category: event.target.value});
    }

    render() {
        var inputCategorySelect = null;
        if (this.state.categories == null)
        {
            inputCategorySelect = e(GenericText, {area: "admin", text: "Loading categories...."});
        }
        else {
            let categories = [];
            for (let cat in this.state.categories) {
                let category = this.state.categories[cat];
    
                categories.push(e("option", {value: category.id}, category.name));
            }
            inputCategorySelect = e("select", {className: "admin-input", form: "admin-form-attribute", 
                    name: "category-select", id: "category-select", onChange: this.handleChangeCategory}, categories);
            inputCategorySelect = [createInputLabel(inputCategorySelect, "Category"), inputCategorySelect];
        }
        
        var error = null;
        if (this.state.invalid) error = e(GenericError, {text: "Invalid submission!"});

        return [this.title, this.inputAttribute, inputCategorySelect, this.buttonSubmit, error];
    }
}

class AdminCategoryForm extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        
        this.inputValue = e(GenericInput, {area: "admin", text: "Category Name", handleInput: this.handleChangeValue});
        this.inputShowNull = e(GenericInput, {area: "admin", text: "Show when nothing selected", type: "checkbox", handleInput: this.handleChangeBool});
        this.inputShowMulti = e(GenericInput, {area: "admin", text: "Allow multiple choices", type: "checkbox", handleInput: this.handleChangeMulti});
        this.buttonSubmit = e(GenericButton, {area: "admin", text: "Submit", click: this.handleSubmit});

        this.title = e(GenericText, {area: "admin", type: "title", text: "Category Creator"});

        //this.inpValue[1].props.onChange = this.handleChange;
        this.state = {val: null, invalid: false, showNull: false, multi: false};
    }

    handleSubmit = () => {
        fetchPostRequest("categories", {
                token: this.user.token,
                value: this.state.val,
                showNull: this.state.showNull,
                multi: this.state.multi,
                id: this.user.id
        }) 
            .then(response => {
                if (response.code != 0 && response.code != 2) {
                    this.setState({ invalid: true });
                }
                else {
                    this.setState({ invalid: false });
                }
            }).catch(() => {this.setState({invalid: true});});
    }

    handleChangeValue = (event) => { 
        this.setState({val: event.target.value});
    }
    handleChangeBool = (event) => { 
        this.setState({showNull: event.target.value == "on" ? true : false});
    }

    handleChangeMulti = (event) => { 
        this.setState({multi: event.target.value == "on" ? true : false});
    }

    render() {
        var info = null;
        if (this.state.invalid) info = e(GenericError, {text: "Invalid category submission!"});
        return [this.title, this.inputValueLabel, this.inputValue, this.inputShowMulti, this.inputShowNull, this.buttonSubmit, info];
    }
}

class AdminSupplierForm extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;

        this.title = e(GenericText, {area: "admin", text: "Supplier Creator", type: "title"});

        this.inputName = e(GenericInput, {area: "admin", text: "Supplier Name", handleInput: this.handleChangeName});
        this.buttonSubmit = e(GenericButton, {area: "admin", text: "Submit", click: this.handleSubmit});


        this.inputDescription = e("textarea", { className: "admin-input", id: "admin-form-supplier-description", form: "admin-form-supplier", rows: 3, cols: 22, onInput: this.handleChangeDescription});
        this.inputDescription = [createInputLabel(this.inputDescription, "Supplier Description (Internal-only)"), this.inputDescription];

        this.state = {name: null, description: null, error: false};
    }

    handleSubmit = () => {
        fetchPostRequest("suppliers", {token: this.user.token, id: this.user.id, name: this.state.name, description: this.state.description})
        .then(response => {
            if (response.code == 0) {
                this.setState({error: false});
            }
            else this.setState({error: true});
        })
        .catch(() => {this.setState({error: true});});
    }

    handleChangeName = (event) => {
        this.setState({name: event.target.value});
    }
    handleChangeDescription = (event) => {
        this.setState({description: event.target.value});
    }

    render() {
        var error = null;
        if (this.state.error) error = e(GenericError, {text: "An unexpected problem has arose!"});
        return [this.title, this.inputName, this.inputDescription, this.buttonSubmit, error];
    }
    

}




class AdminStock extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;

        this.token = props.token;
        this.uid = props.uid;

        this.stockList = e(AdminStockList, {user: this.user, handler: this.handleSelect});
        this.state = {selected: null};
    }

    handleSelect = (id) => {
        this.setState({selected: id});
    }

    render() {
        let viewer = e(AdminStockViewer, {user: this.user, key: this.state.selected, product: this.state.selected});
        let adder = e(AdminStockAdder, {user: this.user, product: this.state.selected});
        let box1 = e("div", {className: "admin-box-large"}, this.stockList, viewer);
        let box2 = e("div", {className: "admin-box-large"}, 
            e("div", {className: "admin-box-small"}, 
                e("h3", null, "List Info"),
                e("p", {className: "text-red"}, "Red items have no stock left."),
                e("p", {className: "text-orange"}, "Orange items have less than ten left in stock."),
                e("p", {className: "text-green"}, "Green items have ten or more in stock.")
            ), adder
        );

        return e("div", {id: "admin-stock"}, box1, box2);
    }
}

class AdminStockViewer extends React.PureComponent {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.product = props.product;

        this.title = e(GenericText, {area: "admin", type: "title", text: "Stock Viewer"});

        if (this.product == null || this.product == undefined) {
            this.state = {info: null, error: false, empty: true};
        }
        else {
            fetchPostRequest("stock/info", {
                token: this.user.token,
                id: this.user.id,
                product: this.product
            })
             
            .then(response => {
                if (response.code == 0) {
                    this.setState({info: response.stock, code: response.productCode, error: false});
                } 
                else {
                    this.setState({info: null, error: true});
                }
            })
            .catch(() => {this.setState({info: null, error: true});});
            this.state = {info: null, error: false, empty: false};
        }
    }


    render() {
        let view = null;
        if (this.state.empty) view = e(GenericText, {area: "admin", text: "Select a product to get started!"});
        else if (this.state.error) view = e(GenericError, {text: "Failed to load stock information!"});
        else if (this.state.info == null) view = e(GenericText, {area: "admin", text: "Loading stock info..."});
        else {
            let total = 0;
            let items = [];
            for (let s in this.state.info) {
                let stock = this.state.info[s];
                total += stock.quantity;
                let name = e(GenericText, {area: "admin", text: "| " + stock.name});
                let desc = e(GenericText, {area: "admin", text: stock.quantity + " " + stock.description});
                items.push(e("div", {key: stock.name}, name, desc));
            }

            if (total == 0) view = e("p", {className: "text-bold"}, "This product is out of stock!");
            else items.push(e("p", null, "In total, this product has " + total + " remaining items in stock."));
            view = items;
        }
        return e("div", {className: "admin-box-small"}, this.title, view);
    }
}

class AdminStockList extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.handler = props.handler;

        fetchPostRequest("stock/list", {
            token: this.user.token,
            id: this.user.id
        }) 
            .then(response => {
                if (response.code == 0) {
                    this.setState({ stock: response.stock, error: false });
                }
                else this.setState({ stock: null, error: true });
            })
            .catch(() => { this.setState({ stock: null, error: true }); });

        this.title = e(GenericText, {area: "admin", text: "Select product!"});
        this.state = { stock: null, selected: null, error: false, updater: 0};
    }


    handle = (id) => {
        this.setState({selected: id});
        this.handler(id);
    }

    render() {
        let list = null;
        if (this.state.error) list = e(GenericError, {text: "Stock could not be loaded!"});
        else if (this.state.stock == null) list = e(GenericText, {area: "admin", text: "Loading stock..."});
        else {
            let products = [];
            for (let s in this.state.stock) {
                let stock = this.state.stock[s];
                let sel = stock.id == this.state.selected;
                products.push(e(AdminStockListItem, {key: s, product: stock, handling: this.handle, selected: sel}));
            }
            list = e("div", {className: "admin-list"}, products);
        }
        return e("div", {className: "admin-box-small"}, this.title, list);
    }
}
class AdminStockListItem extends React.Component {
    constructor(props) {
        super(props);

        this.product = props.product;
        this.handler = props.handling;
    }

    handleClick() {
        this.handler(this.product.id);
    }

    render() {
        let textClass = "text-green";
        if (this.props.selected) textClass = "text-selected";
        else if (this.product.quantity == 0) textClass = "text-red";
        else if (this.product.quantity < 10) textClass = "text-orange";

        let body = e("p", { className: "admin-text-list " + textClass, onClick: this.handleClick.bind(this)}, this.product.code);
        return body;
    }
}

class AdminStockAdder extends React.Component {
    constructor(props) {
        super(props);

        this.user = props.user;
        this.product = props.product;

        this.title = e(GenericText, {area: "admin", text: "Stock Adjuster"});

        this.quantity = e("input", {id: "admin-stock-adder-quantity", className: "admin-input", key: "admin-stock-adder-quantity", form: "admin-stock-adder", type: "number", step: 1, onInput: this.handleChangeQuantity});
        this.quantity = [createInputLabel(this.quantity, "Quantity"), this.quantity];

        this.buttonSet = e(GenericButton, {area: "admin", text: "Set quantity", click: this.handleSet});
        this.buttonAdd = e(GenericButton, {area: "admin", text: "Add quantity", click: this.handleAdd});

        fetchPostRequest('stock/locations/get', {
            token: this.user.token,
            id: this.user.id
        })
        .then(response => {
            if (response.code == 0) {
                this.setState({loadError: false, locations: response.locations});
            }
            else {
                this.setState({loadError: true});
            }
        })
        .catch(() => {this.setState({loadError: true});});

        this.state = {locations: null, loadError: false, quantity: 0, location: null, error: null};
    }

    handleChangeQuantity = (event) => {
        this.setState({quantity: event.target.value});
    }
    handleChangeLocation = (event) => {
        this.setState({location: event.target.value});
    }
    handleSet = () => {
        this.handleSubmit("set");
    }
    handleAdd = () => {
        this.handleSubmit("add");
    }

    handleSubmit(mode) {
        if (this.product == null || this.state.location == null || (this.state.quantity == 0 && mode == "add")) this.setState({error: "One of your parameters is incorrect!"});
        else {
            fetchPostRequest("stock/change", {
                token: this.user.token,
                id: this.user.id,
                product: this.product,
                location: this.state.location,
                quantity: this.state.quantity,
                mode: mode
            }) 
            .then(response => {
                if (response.code == 0) this.setState({error: null});
                else if (response.code == 1) this.setState({error: "Insufficient permission?!"});
                else this.setState({error: "An error has occurred."});
            })
            .catch(() => {
                this.setState({error: "An error has occurred."});
            });
        }
        
    }

    render() {
        this.product = this.props.product;

        let loc;
        if (this.state.loadError) loc = e(GenericError, {text: "Couldn't load stock storage locations!"});
        else if (this.state.locations == null) loc = e(GenericText, {text: "Loading locations..."});
        else {
            let locations = [];
            for (let l in this.state.locations) {
                let location = this.state.locations[l];
                locations.push(e("option", {key: location.name, value: location.id}, location.name));
            }
            loc = e("select", {key: "admin-stock-adder-select", id: "admin-stock-adder-select", form: "admin-stock-adder", className: "admin-input", onChange: this.handleChangeLocation}, locations);
            loc = [createInputLabel(loc), loc];
        }

        let error = null;
        if (this.state.error != null) error = e(GenericError, {text: this.state.error});

        return e("form", {className: "admin-box-small", form: "admin-stock-adder"}, this.title, loc, this.quantity, this.buttonSet, this.buttonAdd, error);
    }
}



class Main extends React.Component{
    constructor() {
        super();

        this.state = {showLogOnScreen: true, showAccountScreen: false, screen: "REGULAR", user: null, seed: 0};
    }

    handleToggleLogScreen = () => {
        this.setState({showLogOnScreen: !this.state.showLogOnScreen});
    }

    handlePurchaseScreen = () => {
        this.setState({screen: "PURCHASING"});
    }

    handleRegularScreen = () => {
        this.setState({screen: "REGULAR"});
    }

    // This handles whether to open the account screen or not.
    handleToggleAccountScreen = () => {
        if (this.state.showAccountScreen) this.setState({showAccountScreen: false, seed: "BEGONE FOUL SPOT"});
        else {
            // we check to make sure there is actually a user and the logon screen isn't visible. 
            if (this.state.user != null && !this.state.showLogOnScreen) {
                this.setState({showAccountScreen: true, seed: Math.random()});
            }
        }
    }


    handleToggleAdminScreen = () => {
        if (this.state.screen == "REGULAR") {
            fetchPostRequest("products/list", {
                        token: this.state.user.token,
                        id: this.state.user.id
                }) 
                .then(response => {
                    if (response.code != 0) {
                        
                    }
                    else {
                        this.setState({screen: "ADMIN"});
                    }
                });
            
        }
        else this.setState({screen: "REGULAR"});
    }

    // send a post request to attempt a login. 
    handleLoginAttempt = (Email, Password) => {
        fetchPostRequest("session", {
            email: Email,
            password: Password
        }) 
        .then(response => {
            if (response.code != 0) {

            }
            else {
                let user = {id: response.id, token: response.token, admin: response.level == 1};

                this.setState({user: user});
                this.handleToggleLogScreen();
            }
        });
    }

    handleLogout = () => {
        this.setState({user: null, userid: null, token: null, admin: false});
    }

    handleAccountUpdate = () => {
        this.setState({seed: Math.random()});
    }

    render() {
        let accountMenu = e(AccountMenu, {show: this.state.showAccountScreen, logoutHandler: this.handleLogout, updateHandler: this.handleAccountUpdate, closeHandler: this.handleToggleAccountScreen, user: this.state.user, key: "acc" + this.state.seed});
        if (this.state.screen == "REGULAR") {
            let content = e(CustomerScreen, 
                {
                    key: this.state.user == null ? "custnull" : this.state.user.id, purchaseHandler: this.handlePurchaseScreen, user: this.state.user,
                    loginHandler: this.handleToggleLogScreen, adminHandler: this.handleToggleAdminScreen, accountHandler: this.handleToggleAccountScreen
                });
            let loginMenu = e(LoginMenu, {closeHandler: this.handleToggleLogScreen, loginHandler: this.handleLoginAttempt, show: this.state.showLogOnScreen, key: "log-" + this.state.showLogOnScreen});
            
            return e("div", null, loginMenu, accountMenu, content);
        }
        else if (this.state.screen == "PURCHASING") {
            let content = e(PurchasingScreen, { user: this.state.user, mainHandler: this.handleRegularScreen, loginHandler: this.handleToggleLogScreen, adminHandler: this.handleToggleAdminScreen, accountHandler: this.handleToggleAccountScreen });

            return e("div", null, content, accountMenu);
        }
        else if (this.state.screen == "ADMIN") {
            let content = e(AdminScreen, {user: this.state.user, openAdminHandler: this.handleToggleAdminScreen, openAccountHandler: this.handleToggleAccountScreen});
            
            return e("div", null, content, accountMenu);
        }
        else {
            return e("h1", null, "404: Page Not Found");
        }
        
        
        
        
    }
}

const main = e(Main);
var htmRoot = ReactDOM.createRoot(document.querySelector('#root'));

htmRoot.render(main);

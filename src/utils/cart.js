export function getCart(){
    let cart = localStorage.getItem("cart");
    cart = JSON.parse(cart);

    if(cart == null){
        cart = []
        localStorage.setItem("cart", JSON.stringify(cart));
    } 
    return cart
}



export function removeFromCart(productId){
    let cart = getCart();

    const newCart = cart.filter((
        item) => {
            return item.productId != productId
    })

    localStorage.setItem("cart", JSON.stringify(newCart));
}


export function addToCart(product, qty){

    let cart = getCart()

    let index = cart.findIndex((item) => {
        return item.productId == product.productId;
    });

    if(index == -1){
        cart[cart.length] ={
            productId: product.productId,
            name: product.name,
            image: product.image,
            altName: product.altName,
            description: product.description,
            price: product.price,
            labelledPrice: product.labelledPrice,
            qty: 1,
        }
    }
    else{
        let newQty = cart[index].qty + qty;
        if(newQty <= 0){
            // removeFromCart(product.productId)
            newQty = 0
            return;
        }
        else{
            cart[index].qty = newQty
        }
    }
    localStorage.setItem("cart", JSON.stringify(cart));
}


export function getItemsTotal() {
    let cart = getCart();

    let itemsTotal = cart.reduce(
        (itemsTotal, item) => itemsTotal + item.labelledPrice * item.qty,
        0
    );

    return itemsTotal;
}

export function getItemsDiscount() {
    let cart = getCart();

    let itemsDiscount = cart.reduce(
        (itemsDiscount, item) => itemsDiscount + (item.labelledPrice - item.price) * item.qty,
        0
    )
    return itemsDiscount;
}

export function getSubTotal() {
    let cart = getCart();

    let subTotal = cart.reduce(
        (subTotal, item) => subTotal + item.price * item.qty,
        0
    )
    return subTotal;
}

export function getEstimatedTotal() {
    let cart = getCart() || [];

    let estimatedTotal = cart.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.qty) || 0;
        return total + price * qty;
    }, 0);

    return estimatedTotal;
} 
'use client';
import React, { useEffect, useState } from 'react';
import Headers from '../components/Headers/page';
const Page = () => {
    const initialFormState = {
        name: '',
        quantity: '',
        price: ''
    };
    const [productForm, setProductForm] = useState(initialFormState);
    const [stock, setStock] = useState([]);
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState('');
    const [isDropdown, setIsDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
const [product,displayproduct] = useState('')
    const addProduct = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/apis/mongo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productForm)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const result = await response.json();
            displayproduct('your product has been added successefully')
            setTimeout(() => {
                displayproduct('')
                
            }, 2000);
            // Reset the form
            setProductForm(initialFormState);

            // Fetch the updated stock
            fetchStock();
        } catch (error) {
            console.error('Error adding product:', error.message);
        }
    };

    const fetchStock = async () => {
        try {
            const response = await fetch('/apis/mongo', {
                method: 'GET'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const result = await response.json();
            setStock(result); // Assume result is an array of products
        } catch (error) {
            console.error('Error fetching stock:', error.message);
        }
    };

    const onChange = (e) => {
        setProductForm({ ...productForm, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        fetchStock();
    }, [loading]);

    useEffect(() => {
        if (query.length < 3) {
            setResults([]);
            setIsDropdown(false);
            setLoading(false);
            return;
        }
        const fetchResults = async () => {
            try {
                const res = await fetch(`/apis/search?q=${query}`);
                const data = await res.json();
                setResults(data);
                console.log(data);
                setIsDropdown(true);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching search results:', error);
                setResults([]);
                setIsDropdown(false);
                setLoading(false);
            }
        };
        setLoading(true);
        fetchResults();
    }, [query]);
    const updateone  = async(Action,name,initialquantaty)=>{
        const index = results.findIndex((item)=>item.name)
        const newresults = [...results]
        if (Action === 'plus') {
            newresults[index].quantity = parseInt(initialquantaty)+1
            
        }
        else{
            newresults[index].quantity = parseInt(initialquantaty)-1

        }
        setResults(newresults)
        const stockindex = stock.findIndex((item)=>item.name)
        const newstock = [...stock]
        if (Action === 'plus') {
            newstock[stockindex].quantity =parseInt(initialquantaty)+1
            
        }
        else{
            newstock[stockindex].quantity =parseInt(initialquantaty)-1

        }
        setStock(newstock)
        setLoading(true)
        console.log(initialquantaty)
            const response = await fetch('/apis/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({Action,name,initialquantaty})
            });
console.log(response)
const result = await response.json()
setLoading(false)


    }

    return (
        <>
            <Headers />
            <div className="container  mx-auto p-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Add a Product</h1>
                <div className='text-green-600 text-center'> {product} </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                  
                  
                    Search a Product
                    <input
                        value={query}
                        name="name"
                        type="text"
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search..."
                        className="ml-4 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    <select className="ml-4 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <option value="all">All</option>
                        <option value="category1">Category 1</option>
                        <option value="category2">Category 2</option>
                    </select>
                </h1>
                <div>
                    {loading ? (
                      <svg width="40" className='mx-auto' height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="black">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="10" fill="none" stroke-dasharray="188.4 62.8" >
    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite" />
  </circle>
</svg>
                    ) : (
                        isDropdown && results.length > 0 && (
                            <ul className="bg-white border rounded shadow-md mt-2">
                                {results.map((item) => (
                                    <li key={item._id} className="flex justify-between p-2 border-b hover:bg-gray-200">
                                        <span>{item.name} ({item.quantity} availaible for ₹{item.price})</span>
                                        <div className='space-x-5'>

                                        <div class="flex items-center ">
                                        <div class="flex items-center space-x-4">
    <button class="add bg-purple-600 p-2 cursor-pointer rounded-xl w-9 text-white" onClick={()=>updateone('plus',item.name,item.quantity)}><div className='w-3'>+</div></button>
    <span class="quantity font-semibold">{item.quantity}</span>
    <button class="subtract bg-purple-600 p-2 cursor-pointer rounded-xl w-9 text-white"><div className='w-3' onClick={()=>updateone('minus',item.name,item.quantity)}>-</div></button>
</div>
</div>
                                        </div>


                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </div>

                <form className="mt-4 mb-8" onSubmit={addProduct}>
                    <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Add a Product</h1>

                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                            Product Name
                        </label>
                        <input
                            onChange={onChange}
                            id="name"
                            name="name"
                            type="text"
                            value={productForm.name}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
                            Quantity
                        </label>
                        <input
                            onChange={onChange}
                            id="quantity"
                            name="quantity"
                            type="number"
                            value={productForm.quantity}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                            Price
                        </label>
                        <input
                            onChange={onChange}
                            id="price"
                            name="price"
                            type="number"
                            value={productForm.price}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Add Product
                    </button>
                </form>
            </div>

            <div className="container my-6  mx-auto">
                <h2 className="text-xl font-semibold">Current Stock</h2>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2">ID</th>
                            <th className="py-2">Product Name</th>
                            <th className="py-2">Quantity</th>
                            <th className="py-2">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.map((item, index) => (
                            <tr key={index} className="bg-gray-100 border-b">
                                <td className="py-2 px-4">{item._id}</td>
                                <td className="py-2 px-4">{item.name}</td>
                                <td className="py-2 px-4">{item.quantity}</td>
                                <td className="py-2 px-4">{item.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default Page;
import {Link} from "react-router-dom";


function Navbar(){


return (

<nav className="
bg-white
shadow-sm
border-b
px-8
py-4
flex
justify-between
items-center
">


<h1 className="
text-xl
font-bold
text-indigo-600
">

SIM-KRS

</h1>



<div className="
flex
gap-6
text-gray-600
">


<Link
className="hover:text-indigo-600"
to="/mahasiswa"
>

Dashboard

</Link>


<Link
className="hover:text-indigo-600"
to="/keranjang"
>

Keranjang

</Link>


</div>


</nav>

)

}


export default Navbar;
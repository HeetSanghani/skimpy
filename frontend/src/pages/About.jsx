import Navbar from '../components/Navbar';
import CateNavbar from '../components/CategoryNavbar';
import Footer from '../components/Footer';


export default function Home() {
    return (
        <>
          <Navbar />
          <CateNavbar/>
        <div className="flex flex-col min-h-screen bg-gray-50">
           

       
        <h1 className="text-4xl font-bold mb-4 text-gray-800">about page!!!!</h1>

       <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quos perspiciatis esse itaque odio suscipit ipsa facere eligendi voluptate aperiam?</p>
       <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quos perspiciatis esse itaque odio suscipit ipsa facere eligendi voluptate aperiam?</p>
       <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quos perspiciatis esse itaque odio suscipit ipsa facere eligendi voluptate aperiam?</p>
      
        </div>
          <Footer />
        </>
    );
}

import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="content">
            <h2 style={{ fontWeight: 400 }}>404 - Page Not Found</h2>
            <p>Sorry, the page was not found for your request.</p>
            <Link to="/">Go to Main page</Link>
        </div>
    );
};

export default NotFoundPage;

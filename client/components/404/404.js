const noFound = () => {
    return (
        <div className="not-found-page"
             style={{
                 width: '100%',
                 display: 'flex',
                 alignItems: 'center',
                 flexDirection: 'column'}}>
            <h2>Page not found</h2>
            <h1>404 Error</h1>
        </div>
    );
};

export default noFound;
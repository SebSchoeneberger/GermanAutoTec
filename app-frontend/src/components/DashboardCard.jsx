function DashboardCard({
    title,
    icon,
    description,
}) {
    return ( 
        <>
            <div className="card bg-base-100 w-96 shadow-sm">
                <figure className="px-10 pt-10 flex justify-center">
                   {icon}
                </figure>
                <div className="card-body items-center text-center">
                    <h2 className="card-title">{title}</h2>
                    <p>{description}</p>
                    <div className="card-actions">
                    <button className="btn btn-primary">Open</button>
                    </div>
                </div>
            </div>
        </>
     );
}

export default DashboardCard;
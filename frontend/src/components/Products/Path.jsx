import { Link } from "react-router-dom";
import { capitalize } from "../Helpers/Helpers";

// Breadcrumb trail; the last entry is the current page, so it is text rather than a link.
const Path = ({ path }) => {
  const trail = [{ route: "Home", link: "/" }, ...path];
  return (
    <nav aria-label="Breadcrumb" className="path-links container">
      <ol className="path-list">
        {trail.map((routeInstance, i) => {
          const isLast = i === trail.length - 1;
          const label = capitalize(routeInstance.route);
          return (
            <li key={`${routeInstance.route}-${i}`} className="path-item">
              {isLast ? (
                <span aria-current="page" title={label}>
                  {label}
                </span>
              ) : (
                <Link to={routeInstance.link}>{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Path;

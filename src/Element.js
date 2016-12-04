import React from 'react';
import ReactFireComponent from './ReactFireComponent';
import './Element.css';
import makeRows from './makeRows';

class Element extends ReactFireComponent {
  componentDidMount() {
    let component = this;
    this.refs.root.addEventListener('hold', (event)=>{
      if (component.depth() === 0 || true) {
        component.push({
          index : component.indexFromXY(event.x, event.y),
          importance : 1
        });
      }
    });
    let dragging = false;
    //  Drag and drop into other elements
    this.refs.root.addEventListener('dragone', (event)=>{
      if (component.depth() === 1) {
        dragging = true;
        component.refs.root.style.transform = 'translate(' + event.tx + 'px,'+ event.ty + 'px)';
        component.refs.root.style.zIndex = 10;
        component.refs.root.classList.add('Dragging');
      }
    });
    this.refs.root.addEventListener("drop", (event)=>{
      if (dragging) {
        let oldbbox = component.refs.root.getBoundingClientRect();
        let targetX = oldbbox.left;
        let targetY = oldbbox.top;
        dragging = false;
        //  need 2 animation frames for css to catch up for transition...
        component.setState({
          index : component.props.parentIndexFromXY(event.x, event.y)
        });

        requestAnimationFrame(()=>{
          component.refs.root.style.display = 'hidden'; //  helps to not freak out the rendering loop
          component.refs.root.style.transform = 'translate(0px,0px)';
          component.refs.root.style.display = null;
          let bbox = component.refs.root.getBoundingClientRect();
          component.refs.root.style.transform = 'translate('+(targetX-bbox.left)+'px,'+(targetY-bbox.top)+'px)';
          requestAnimationFrame(()=>{
            component.refs.root.classList.remove('Dragging');
            requestAnimationFrame(()=>{
              component.refs.root.style.zIndex = 1;
              component.refs.root.style.transform = 'translate(0px,0px)';
            })
          });
        });

        //  TODO: high velocity off edge should trigger remove too
        if (event.x > window.innerWidth
        ||  event.y > window.innerHeight
        ||  event.x < 0
        ||  event.y < 0) {
          component.props.remove();
        }
      }
    });
  }
  depth() {
    return this.props.depth || 0;
  }
  indexFromXY(x,y) {
    let component = this;
    let children = [];
    if (this.state) {
      Object
        .keys(this.state)
        .map((key)=>{
          //  collect all children that can be sorted for display
          //  must have index and importance defined to show
          if (!isNaN(this.state[key].index)
          &&  !isNaN(this.state[key].importance)) {
            //  store the childs key in the key field
            this.state[key].key = key;
            children.push(this.state[key]);
          }
          return null;
        });
    }
    children.sort((a,b)=>{
      return a.index - b.index;
    });

    //  filter removed children;
    children = children.filter((child)=>{
      return !child.removed;
    });

    let currentIndex;
    Array.from(component.refs.root.children).filter((child)=>{
      return child.classList.contains('ElementChild');
    }).forEach((childElement, index)=>{
      let bbox = childElement.getBoundingClientRect();
      if (bbox.left+bbox.width/2 > x && bbox.top+bbox.height > y && currentIndex === undefined) {
        if (index === 0) {
          currentIndex = children[index].index-1;
        }
        else {
          currentIndex = (children[index].index+children[index-1].index)/2;
        }
      }
    });
    if (currentIndex === undefined) {
      if (children.length) {
        currentIndex = children[children.length-1].index + 1;
      }
      else {
        currentIndex = 1;
      }
    }
    return currentIndex;
  }
  render() {
    let component = this;

    let children = [];
    if (this.state) {
      Object
        .keys(this.state)
        .map((key)=>{
          //  collect all children that can be sorted for display
          //  must have index and importance defined to show
          if (!isNaN(this.state[key].index)
          &&  !isNaN(this.state[key].importance)) {
            //  store the childs key in the key field
            this.state[key].key = key;
            children.push(this.state[key]);
          }
          return null;
        });
    }
    children.sort((a,b)=>{
      return a.index - b.index;
    });


    //  filter removed children;
    children = children.filter((child)=>{
      return !child.removed;
    });

    let elementChildren = [];

    makeRows(children).map((row, rowIndex)=>{
      elementChildren.push(<div className="ElementChildRowDivider" key={rowIndex}></div>);
      row.columns.map((column, columnIndex)=>{
        let style = {
          flexGrow : column.importance,
          height : row.height
        };
        let childClasses = "ElementChild";
        if (columnIndex === 0) {
          childClasses += " FirstInRow";
        }
        let remove = ()=>{
          //  remove only ever executed in parent
          //  since no need to delete data immediately
          let update = {};
          update[column.key] = component.state[column.key];
          component.state[column.key].removed = Date.now();
          component.setState(update);
        };

        elementChildren.push(<div className={childClasses} key={column.key} style={style}>
          <Element url={column.key} depth={component.depth()+1} key={column.key} remove={remove} parentIndexFromXY={(x,y)=>{return component.indexFromXY(x,y);}}/>
        </div>);
        return null;
      });
      return null;
    });
    elementChildren.push(<div className="ElementChildRowDivider" key={elementChildren.length}></div>);
    let elementClasses = ["Element"];
    if (children.length === 0) {
      elementClasses.push("NoChildren");
    }
    if (this.depth() === 0) {
      elementClasses.push("Root");
    }
    return (
      <div className={elementClasses.join(" ")} ref="root">
        {elementChildren}
      </div>
    );
  }
}

export default Element;
# jadeDom

jadeDom is a [jQuery](http://www.jquery.com/) plugin to help render DOM elements with [Jade](http://jade-lang.com/) syntax.

## Examples

### HTML as a String

```javascript
$('#wrapper').append( [
  '<div class="class_name">',
    '<a href="#" title="Some title" class="inner_class">Some text</div>',
  '</div>'
].join( '' ) );
$('#wrapper .class_name' ).click( function () { alert('hi'); } );
```

### jQuery

```javascript
$('#wrapper').append(
  $( '<div />', { 'class': 'class_name', click: function () { ... } } ).append(
    $( '<a />', { 'class': 'inner_class', href: '#', title: 'Some title', text: 'Some text' } )
  )
);
```

### zenDom

```javascript
$('#wrapper').append( $.zen(
  'div.class_name', { click: function () { ... } }, [
    'a.inner_class[href=#][title=Some title]{Some text}'
  ]
) );
```

### jadeDom

```javascript
$('#wrapper').append( $.jade(
  'div.class_name', { click: function () { ... } }, [
    'a.inner_class(href=#, title="Some title") Some text'
  ]
) );
```

## Documentation

### Basic Usage

Arguments passed to jadeDom can be one of three types:

**DOM Element**: DOM Elements can come in as a *string*, *DOM element*, *DOM Fragment*, or *jQuery DOM Object*.  The first argument **MUST** be one of these formats.
**jQuery Options**: This is an *object* that will specify which jQuery functions to call.
**Child Elements**: This is an array of child elements to be attached to the most recent *DOM Element* at this depth.

The example above demonstrates all 3 of these.  ```'.class_name'``` tells jadeDom to render a *div* element with a class of *class_name*. ```{ click: function () { ... } }``` attaches a click event to that element.  The following array attaches a child element to that node.

### Caching

The Options object can also accept a ```cache``` property.  This property should be a *string* that will be used to look up a DOM element later.  This will save you the trouble of having to perform a costly jQuery lookup later.

```javascript
var $dom = $.jade( 'div.something', { cache: 'something' } ); // the div was cached as 'something'
var $something = $dom.jade( 'something' ); // something was pulled from cache by calling z() on the jadeDom object
 ```

As you can see above, calling ```$dom.jade(str)``` on a jadeDom object will allow you to access any cached elements.  You can also access the full lookup table by calling ```$dom.jade()``` without any arguments.
 
### Supported Jade Features
 
#### ID's and Classes

ID's and classes are set using CSS syntax - that is a ```#``` represents an ID and a ```.``` represents a class.

```javascript
$.jade( 'div#foo.bar.baz' );
```

```html
<div id="foo" class="bar baz"></div>
```

#### Attributes

Attributes in Jade are wrapped in ```()```.  You can have multiple attributes by separating them with a comma.  Both attribute names and values can optionally be wrapped in single or double quotes.

```javascript
$.jade( 'a(href=#, title="Foo")' );
```

```html
<a href="#" title="Foo">Bar</a>
```

#### Tag Text

Adding text to a tag can be accomplished by simply adding a space after the tag details and some text.

```javascript
$.jade( 'h1#foo.bar Baz' );
```

```html
<h1 id="foo" class="bar">Baz</h1>
```

If you want to create a text node without having it be part of another tag, that can be accomplished by starting your string with a ```|```.

```javascript
$.jade(
  'p', [
    '| foo bar baz ',
    '| rawr rawr ',
    '| super cool ',
    '| go jade go '
  ]
);
```

```html
<p>foo bar baz rawr rawr super cool go jade go</p>
```


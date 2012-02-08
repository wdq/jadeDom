/*! jadeDom v1.0 by Robert Messerle  |  https://github.com/robertmesserle/jadeDom */
( function ( $ ) {

	function jadeDom () {
		this.lookup_table = {};
		this.map = false;
	}
	jadeDom.prototype = {
		init: function ( args ) {
			var ret = this.add_children( false, args, true ),
				$ret = $( ret );
			$ret.lookup = $.proxy( this, 'lookup' );
			return $ret;
		},
		lookup: function ( str ) {
			if ( !str ) return this.lookup_table;
			return this.lookup_table[ str ] || false;
		},
		handle_object: function ( elem, obj ) {
			if ( elem === false ) return this.map = obj;
			var $elem = $(elem), val;
			for ( var key in obj ) {
				val = obj[ key ];
				switch ( key ) {
					case 'cache': this.cache_lookup( val, $elem ); break;
					default:
						if ( $elem[ key ] ) $elem[ key ]( val );
						else $elem.attr( key, val );
						break;
				}
			}
		},
		cache_lookup: function ( key, $elem ) {
			var keys = key.split( ' ' ),
				i    = keys.length;
			while ( i-- ) {
				key = keys[ i ];
				this.lookup_table[ key ] = this.lookup_table[ key ]
					? this.lookup_table[ key ].add( $elem )
					: $elem
			}
		},
		get_type: function ( arg ) {
			if ( arg instanceof Array ) return 'children';
			if ( typeof arg === 'string' || arg.jquery || arg.nodeType ) return 'node';
			if ( typeof arg === 'object' ) return 'options';
			return false;
		},
		add_children : function ( elem, children, top_level ) {
			if ( !children.length ) return;
			var last_elem = elem, child, type;
			for ( var i = 0, len = children.length; i < len; i++ ) {
				child = children[ i ];
				type = this.get_type( child );
				switch ( type ) {
					case 'node':
						if ( top_level && elem !== false ) ( elem = document.createDocumentFragment() ).appendChild( last_elem );   // switch to fragment if necessary
						last_elem = this.get_node( child );         // get node and store it in last_elem
						if ( elem === false ) elem = last_elem;     // if there is no root elem yet, set it to last_elem
						else elem.appendChild( last_elem );         // otherwise, append it to the existing node
						break;
					case 'children':    this.add_children( last_elem, child );  break;
					case 'options':     this.handle_object( last_elem, child ); break;
				}
			}
			return elem;
		},
		get_node: function ( elem ) {
			if ( typeof elem === 'string' ) return this.get_node_from_string( elem );
			if ( elem.jquery ) return elem.get( 0 );
			if ( elem.nodeType ) return elem;
		},
		get_node_from_string : function ( str ) {
			return new JadeParser( this, str ).elem;
		},
		set_attributes : function ( elem, attrs ) {
			for ( var key in attrs ) this.set_attribute( elem, key, attrs[ key ] );
		},
		set_attribute : function ( elem, key, value ) {
			switch ( key ) {
				case 'class':
				case 'className': elem.className = value;           break;
				case 'style':     elem.style.cssText = value;       break;
				default:          elem.setAttribute( key, value );  break;
			}
		}
	};

	function JadeParser ( parent, str ) {
		this.parent  = parent;
		this.str     = str + ' ';
		this.mode    = this.get_first_mode();
		this.cur     = 0;
		this.char    = false;
		this.len     = str.length;
		this.attrs   = false;
		this.html    = false;
		this.classes = [];
		this.tag     = false;
		this.id      = false;
		this.clss    = false;
		this.elem    = false;

		this.init();
	}
	JadeParser.prototype = {
		mode_lookup: { '#': 'id', '.': 'class', '(': 'attributes', '|': 'html' },
		cache: {},
		init: function () {
			if ( this.cache[ this.str ] ) {
				this.elem = this.cache[ this.str ].cloneNode( false );
			} else if ( this.mode === 'html' ) {
				this.elem = this.get_html_fragment( this.str.substring( 0, this.len ).replace( /^\|\s?/, '' ) );
			} else {
				this.parse();
				this.create_element();
				this.cache[ this.str ] = this.elem.cloneNode( false );
			}
		},
		get_html_fragment: function ( str ) {
			var frag = document.createDocumentFragment(),
				div  = document.createElement( 'div' );
			div.innerHTML = str;
			while ( div.childNodes.length ) frag.appendChild( div.childNodes[ 0 ] );
			return frag;
		},
		get_first_mode: function () {
			var char = this.str.charAt( 0 );
			return char === '|' ? 'html' : char.match( /\w/ ) ? 'tag' : false;
		},
		jump_to_next: function ( len ) {
			this.mode = false;
			this.cur += len;
		},
		create_element: function () {
			this.elem = document.createElement( this.tag || 'div' );
			if ( this.id ) this.elem.id = this.id;
			if ( this.classes.length ) this.elem.className = this.classes.join( ' ' );
			if ( this.attrs ) this.parent.set_attributes( this.elem, this.attrs );
			if ( this.html[ 0 ] ) this.elem.innerHTML = this.html;
		},
		get_mode: function () {
			this.mode = this.char.match( /\s/ ) ? 'html' : this.mode_lookup[ this.char ] || false;
		},
		handle_mode: {
			'tag': function () {
				this.tag = this.str.substring( this.cur ).match( /^[\w\d\:\_\-]+/ )[ 0 ] || 'div';
				this.jump_to_next( this.tag.length );
			},
			'class': function () {
				var cls = this.str.substring( this.cur ).match( /^[\w\d\:\_\-]+/ )[ 0 ];
				this.classes.push( cls );
				this.jump_to_next( cls.length );
			},
			'id': function () {
				this.id = this.str.substring( this.cur ).match( /^[\w\d\:\_\-]+/ )[ 0 ];
				this.jump_to_next( this.id.length );
			},
			'attributes': function () {
				var key, val;
				if ( this.attrs === false ) this.attrs = {};
				key = this.str.substring( this.cur ).match( /^(\"[^\"]+\")|(\'[^\']+\')|([^=]+)/ )[ 0 ];
				this.cur += key.length;
				key = key.replace( /[\'\"]/g, '' );
				if ( this.str.charAt( this.cur ) === '=' ) {
					val = this.str.substring( this.cur + 1 ).match( /^(\"[^\"]+\")|(\'[^\']+\')|([^\,\)]+)/ )[ 0 ];
					this.cur += val.length + 1;
					val = val.replace( /[\'\"]/g, '' );
				} else {
					val = key;
				}
				this.attrs[ key ] = val;
				if ( this.len < this.cur + 1 );
				else if ( this.str.charAt( this.cur ) === ')' ) this.mode = false;
				else if ( key = this.str.substring( this.cur ).match( /^\,\s*/ ) ) this.cur += key.length;
			},
			'html': function () {
				this.html = this.str.substring( this.cur, this.len ).replace( /^\s+/, '' );
				if ( this.parent.map !== false ) {
					for ( var key in this.parent.map ) {
						this.html = this.html.replace( new RegExp( '#\\{' + key + '\\}', 'g' ), this.escape_html( this.parent.map[ key ] ) );
						this.html = this.html.replace( new RegExp( '!\\{' + key + '\\}', 'g' ), this.parent.map[ key ] );
					}
				}
				this.str = this.str.substring( 0, this.cur );
			}
		},
		escape_html: function ( str ) {
			return str.replace( /&/g, '&ampl;' ).replace( />/g, '&gt;' ).replace( /</g, '&lt;' ).replace( /"/g, '&quot;' );
		},
		get_content: function () {
			if ( this.mode === false ) return;
			this.handle_mode[ this.mode ].apply( this );
		},
		parse: function () {
			while ( this.cur < this.len && this.mode !== 'html' ) {
				if ( this.mode !== 'tag' ) this.char = this.str.charAt( this.cur++ );
				if ( this.mode === false ) this.get_mode();
				this.get_content();
			}
		}
	};

	$.jade = function () {
		var jade = new jadeDom();
		return jade.init( Array.apply( null, arguments ) );
	};

} )( jQuery );
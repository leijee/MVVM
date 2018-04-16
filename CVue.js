function nodeToFragment(node, vm) {
	var flag = document.createDocumentFragment();
	var child;
	while (child = node.firstChild) {
		compile(child, vm);
		flag.append(child);
	}
	return flag;
}

function CVue(options) {
	this.defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g;
	this.init(options);

}
//初始化，将el,以及dada数据传入
CVue.prototype.init = function (options) {
	this.$el = document.querySelector(options.el);
	this.options = options;
	_observe(options.data, this);//挂载数据
	_observe(options.methods, this);//将methods也挂载到vm上

	_observe(options.created,this)//生命周期 created
	var ele = document.getElementById(options.el);
	var dom = nodeToFragment(ele, this);
	//编译完成之后将dom返回到app中
	ele.appendChild(dom);//渲染dom节点
	_observe(options.mounted,this)//生命周期 mounted
}

//监听数据是否发生改变，setter,getter方法
function defineReactive(obj, key, val) {
	var dep = new Dep();
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			if(Dep.target){
				console.log("数据")
				dep.addSub(Dep.target);//这里的Dep.target其实就是watcher对象实例
			}
			return val;
		},
		set: function (newVal) {
			if (val !== newVal) {
				val = newVal;
				console.log("数据发生改变了");
				//监听数据是否发生改变，改变之后立即通知发布者
				dep.notify();
			}
		}
	})
}
/**
 * 将传入的obj上的属性值挂到vm对象上
 **/
function _observe(obj, vm) {
	if(typeof obj == "object"){
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				defineReactive(vm, key, obj[key]);
			}
		}
	}
	if(typeof obj == "function"){
		obj.call(vm);
	}
}
//dom中对象与data数据绑定
function compile(node, vm) {
	var reg = /\{\{(.*)\}\}/;
	var bindReg = /(v\-bind):(.*)/;

	//绑定v-model v-click事件
	if (node.nodeType === 1) {//dom节点
		var attr = node.attributes;//获取所有的属性
		for (var i = 0; i < attr.length; i++) {
			if (attr[i].nodeName == 'v-model' && node.nodeName == 'INPUT') {
				var name = attr[i].nodeValue;//获取v-model绑定的属性名
				new Watcher(vm, node, name);
				node.value = vm[name];
				node.addEventListener("input", function (event) {
					vm[name] = node.value;
				});
			}
			if (attr[i].nodeName == 'v-click') {
				var clickFun = attr[i].value;
				node.addEventListener("click", function () {
					console.log(clickFun);
					var funName ;
					var args;
					var reg1 = /(.*)\(\'(.*)\'\)/g;//获取传入的参数值
					var reg2 = /(.*)\((.*)\)/g;//获取传入的参数值
					if(reg.test(clickFun)){
						funName = RegExp.$1;
						args = RegExp.$2;
					}
					if(reg2.test(clickFun)){
						funName = RegExp.$1;
						args = vm[RegExp.$2];
					}
					vm[funName](args);
				})
			}
			if(bindReg.test(attr[i].nodeName)){
				console.log(RegExp.$2.toLocaleLowerCase() == "src");
				if(RegExp.$2.toLocaleLowerCase() == "src"&&node.nodeName == "IMG"){//当前节点为src
					node.setAttribute("src",vm[attr[i].nodeValue]);
				}
				if(RegExp.$2.toLocaleLowerCase() == "value"&&node.nodeName == "INPUT"){//当前节点为src
					node.setAttribute("value",vm[attr[i].nodeValue]);
				}
			}
			if(attr[i].nodeName == "v-if"){
				if(attr[i].nodeValue == "false"||!vm[attr[i].nodeValue]){
					console.log("false111");
					console.log(node.parentNode,node);
					// node.parentNode.removeChild(node);
					node.parentNode.removeChild(node);
				}
			}
		}

		if(reg.test(node.innerHTML)){
			var name = RegExp.$1;//获取匹4配到的	字符串
			name = name.trim();

			console.log(name);

			// node.nodeValue = vm[name];
			new Watcher(vm, node, name);
		}
	}
	//对dom节点中的文本进行赋值
	if (node.nodeType === 3) {//节点类型为text
		if (reg.test(node.nodeValue)) {
			var name = RegExp.$1;//获取匹4配到的	字符串
			name = name.trim();
			// node.nodeValue = vm[name];
			new Watcher(vm, node, name);
		}
	}
}
/**
 * watch数据是否发生变化
 **/
function Watcher(vm, node, name) {
	Dep.target = this;
	this.name = name;
	this.node = node;
	this.vm = vm;
	this.update();
	Dep.target = null;
}
Watcher.prototype.update = function () {
	var value = {};
	var dataObj = this.vm;
	var value;
	if(this.name.indexOf(".")>-1){
		var objArr = this.name.split(".");
		var len = objArr.length;
		var i = 0;
		while(i<len) {
			dataObj = dataObj[objArr[i]];
			console.log("dataObj",objArr[i],dataObj);
			i++;
		}
		value = dataObj;
	}else{
		value = this.vm[this.name];
	}
	this.node.nodeValue = this.node.innerHTML = value;
	console.log(this.vm);


	if(this.node.nodeName == 'INPUT'){
		this.node.value = this.vm[this.name];
	}
}
/**
 * 订阅/发布模式
 **/
function Dep() {
	this.subs = [];
}
var i=0;
Dep.prototype.addSub = function (sub) {
	this.subs.push(sub);
}
Dep.prototype.notify = function () {
	this.subs.forEach(function (sub) {
		sub.update();
	});
}
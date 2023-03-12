# Solidity 中的变量类型

## 1.数值类型(Value Type)：包括布尔型，整数型等等，这类变量赋值时候直接传递数值

### 1.1 布尔

    bool public _bool = true;

    // 布尔运算
    bool public _bool1 = !_bool; //取非
    bool public _bool2 = _bool && _bool1; //与
    bool public _bool3 = _bool || _bool1; //或
    bool public _bool4 = _bool == _bool1; //相等
    bool public _bool5 = _bool != _bool1; //不相等

### 1.2 整型

    int public _int = -1; // 整数，包括负数
    uint public _uint = 1; // 正整数
    uint256 public _number = 20220330; // 256位正整数

** 代表指数 `2**2`

### 1.3 地址类型

主要功能: 资产接受和查询

    // 地址
    address public _address = 0x7A58c0Be72BE218B41C608b7Fe7C5bB630736C71;
    address payable public _address1 = payable(_address); // payable address，可以转账、查余额
    // 地址类型的成员
    uint256 public balance = _address1.balance; // balance of address

### 1.4 定长字节数组

字节数组 bytes 分两种，一种定长（byte, bytes8, bytes32），另一种不定长。定长的属于数值类型，不定长的是引用类型。 定长 bytes 可以存一些数据，消耗 gas 比较少。

    // 固定长度的字节数组
    bytes32 public _byte32 = "MiniSolidity";
    bytes1 public _byte = _byte32[0]; // 取第一个字节

MiniSolidity 变量以字节的方式存储进变量 `_byte32`，转换成 16 进制为：0x4d696e69536f6c69646974790000000000000000000000000000000000000000

`_byte` 变量存储 `_byte32` 的第一个字节，为 0x4d。

### 1.5 枚举 enum (下标取值)

枚举（enum）是 solidity 中用户定义的数据类型。它主要用于为 uint 分配名称，使程序易于阅读和维护。它与 C 语言中的 enum 类似，使用名称来代替从 0 开始的 uint：

    // 用enum将uint 0， 1， 2表示为Buy, Hold, Sell
    enum ActionSet { Buy, Hold, Sell }
    // 创建enum变量 action
    ActionSet action = ActionSet.Buy;

## 2.引用类型(Reference Type)：包括数组和结构体，这类变量占空间大，赋值时候直接传递地址（类似指针）

### 2.1 数组（array）和结构体（struct）

固定长度数组 和可变长度数组(根据是否有限制区分):

    // 固定长度 Array
    uint[8] array1;
    bytes1[5] array2;
    address[100] array3;

    // 可变长度 Array
    uint[] array4;
    bytes1[] array5;
    address[] array6;
    bytes array7;

对于 memory 修饰的动态数组, 可以使用关键字 new, 但需要指定长度:

    // memory动态数组
    uint[] memory array8 = new uint[](5);
    bytes memory array9 = new bytes(9);

在 solidity 中如果一个值没有指定 type 的话，默认就是最小单位的该 type，这里 int 的默认最小单位类型就是 uint8。

如果创建的是动态数组，你需要一个一个元素的赋值。

    uint[] memory x = new uint[](3);
    x[0] = 1;
    x[1] = 3;
    x[2] = 4;

### 数组操作

length: 数组有一个包含元素数量的 length 成员，memory 数组的长度在创建后是固定的。

push(): 动态数组和 bytes 拥有 push()成员，可以在数组最后添加一个 0 元素。

push(x): 动态数组和 bytes 拥有 push(x)成员，可以在数组最后添加一个 x 元素。

pop(): 动态数组和 bytes 拥有 pop()成员，可以移除数组最后一个元素。

### 结构体 struct

    // 结构体
    struct Student{
        uint256 id;
        uint256 score;
    }

    Student student; // 初始一个student结构体

赋值的两种方法:

    //  给结构体赋值
    // 方法1:在函数中创建一个storage的struct引用
    function initStudent1() external{
        Student storage _student = student; // assign a copy of student
        _student.id = 11;
        _student.score = 100;
    }

    // 方法2:直接引用状态变量的struct
    function initStudent2() external{
        student.id = 1;
        student.score = 80;
    }

## 3.映射类型(Mapping Type): Solidity 里的哈希表

    mapping(uint => address) public idToAddress; // id映射到地址
    mapping(address => address) public swapPair; // 币对的映射，地址到地址

### 映射的规则

规则 1：映射的\_KeyType 只能选择 solidity 默认的类型，比如 uint，address 等，不能用自定义的结构体。而\_ValueType 可以使用自定义的类型。下面这个例子会报错，因为\_KeyType 使用了我们自定义的结构体：

    // 我们定义一个结构体 Struct
    struct Student{
        uint256 id;
        uint256 score;
    }
    mapping(Student => uint) public testVar;

规则 2：映射的存储位置必须是 storage，因此可以用于合约的状态变量，函数中的 storage 变量，和 library 函数的参数（见例子）。不能用于 public 函数的参数或返回结果中，因为 mapping 记录的是一种关系 (key - value pair)。

规则 3：如果映射声明为 public，那么 solidity 会自动给你创建一个 getter 函数，可以通过 Key 来查询对应的 Value。

规则 4：给映射新增的键值对的语法为`_Var[_Key] = _Value`，其中 `_Var` 是映射变量名，`_Key 和_Value` 对应新增的键值对。例子：

    function writeMap (uint _Key, address _Value) public{
        idToAddress[_Key] = _Value;
    }

### 映射的原理

原理 1: 映射不储存任何键（Key）的资讯，也没有 length 的资讯。

原理 2: 映射使用 keccak256(key)当成 offset 存取 value。

原理 3: 因为 Ethereum 会定义所有未使用的空间为 0，所以未赋值（Value）的键（Key）初始值都是 0。

## 4.函数类型(Function Type)

    function <function name> (<parameter types>) {internal|external|public|private} [pure|view|payable] [returns (<return types>)]

函数定义解读：

function：声明函数时的固定用法，想写函数，就要以 function 关键字开头。

`<function name>`：函数名。
`(<parameter types>)`：圆括号里写函数的参数，也就是要输入到函数的变量类型和名字。

- {internal|external|public|private}：函数可见性说明符，一共 4 种。没标明函数类型的，默认 internal。

  - public: 内部外部均可见。(也可用于修饰状态变量，public 变量会自动生成 getter 函数，用于查询数值).
  - private: 只能从本合约内部访问，继承的合约也不能用（也可用于修饰状态变量）。
  - external: 只能从合约外部访问（但是可以用 this.f()来调用，f 是函数名）
  - internal: 只能从合约内部访问，继承的合约可以用（也可用于修饰状态变量）。

[pure|view|payable]：决定函数权限/功能的关键字。payable（可支付的）很好理解，带着它的函数，运行的时候可以给合约转入 ETH。

pure 关键字的函数，不能读取也不能写入存储在链上的状态变量。

包含 view 关键字的函数，能读取但也不能写入状态变量。

没有 pure 和 view，函数既可以读取也可以写入状态变量。

[returns ()]：函数返回的变量类型和名称。

- Solidity 有两个关键字与函数输出相关：return 和 returns，他们的区别在于：

  - returns 加在函数名后面，用于声明返回的变量类型及变量名；
  - return 用于函数主体中，返回指定的变量。

    // 返回多个变量
    function returnMultiple() public pure returns(uint256, bool, uint256[3] memory){
    return(1, true, [uint256(1),2,5]);
    }

### 命名式返回

我们可以在 returns 中标明返回变量的名称，这样 solidity 会自动给这些变量初始化，并且自动返回这些函数的值，不需要加 return。

    // 命名式返回
    function returnNamed() public pure returns(uint256 _number, bool _bool, uint256[3] memory _array){
        _number = 2;
        _bool = false;
        _array = [uint256(3),2,1];
    }

### 解构式赋值

solidity 使用解构式赋值的规则，支持读取函数的全部或部分返回值。

读取所有返回值：声明变量，并且将要赋值的变量用,隔开，按顺序排列。

        uint256 _number;
        bool _bool;
        uint256[3] memory _array;
        (_number, _bool, _array) = returnNamed();
        // 读取部分返回值：声明要读取的返回值对应的变量，不读取的留空。下面这段代码中，我们只读取_bool，而不读取返回的_number和_array：
        (, _bool2, ) = returnNamed();

### 以下语句被视为修改链上状态

- 写入状态变量。
- 释放事件。
- 创建其他合约。
- 使用 selfdestruct.
- 通过调用发送以太币。
- 调用任何未标记 view 或 pure 的函数。
- 使用低级调用（low-level calls）。
- 使用包含某些操作码的内联汇编。

## 引用类型 -- 数据存储

数据存储位置有三类：storage，memory 和 calldata。不同存储位置的 gas 成本不同。storage 类型的数据存在链上，类似计算机的硬盘，消耗 gas 多；memory 和 calldata 类型的临时存在内存里，消耗 gas 少。大致用法：

storage：合约里的状态变量默认都是 storage，存储在链上。

memory：函数里的参数和临时变量一般用 memory，存储在内存中，不上链。

calldata：和 memory 类似，存储在内存中，不上链。与 memory 的不同点在于 calldata 变量不能修改（immutable），一般用于函数的参数。例子：

    function fCalldata(uint[] calldata _x) public pure returns(uint[] calldata){
        //参数为calldata数组，不能被修改
        // _x[0] = 0 //这样修改会报错
        return(_x);
    }

storage 会改变原本变量, memory 则不会.

### 全局变量

- 3 个常用的全局变量：msg.sender, block.number 和 msg.data, 其它保留变量
  - blockhash(uint blockNumber): (bytes32)给定区块的哈希值 – 只适用于 256 最近区块, 不包含当前区块。
  - block.coinbase: (address payable) 当前区块矿工的地址
  - block.gaslimit: (uint) 当前区块的 gaslimit
  - block.number: (uint) 当前区块的 number
  - block.timestamp: (uint) 当前区块的时间戳，为 unix 纪元以来的秒
  - gasleft(): (uint256) 剩余 gas
  - msg.data: (bytes calldata) 完整 call data
  - msg.sender: (address payable) 消息发送者 (当前 caller)
  - msg.sig: (bytes4) calldata 的前四个字节 (function identifier)
  - msg.value: (uint) 当前交易发送的 wei 值

### 值类型初始值

- boolean: false
- string: ""
- int: 0
- uint: 0
- enum: 枚举中的第一个元素
- address: 0x0000000000000000000000000000000000000000 (或 address(0))
- function
  - internal: 空白方程
  - external: 空白方程

### 引用类型初始值

- 映射 mapping: 所有元素都为其默认值的 mapping
- 结构体 struct: 所有成员设为其默认值的结构体
- 数组 array
  - 动态数组: []
  - 静态数组（定长）: 所有成员设为其默认值的静态数组

## 常数

- constant 和 immutable

  - constant 变量必须在声明的时候初始化，之后再也不能改变。尝试改变的话，编译不通过。
  - immutable 变量可以在声明时或构造函数中初始化

    // constant 变量必须在声明的时候初始化，之后不能改变
    uint256 constant CONSTANT_NUM = 10;
    string constant CONSTANT_STRING = "0xAA";
    bytes constant CONSTANT_BYTES = "WTF";
    address constant CONSTANT_ADDRESS = 0x0000000000000000000000000000000000000000;

    // 利用 constructor 初始化 immutable 变量，因此可以利用
    constructor(){
    IMMUTABLE_ADDRESS = address(this);
    IMMUTABLE_BLOCK = block.number;
    IMMUTABLE_TEST = test();
    }

    function test() public pure returns(uint256){
    uint256 what = 9;
    return(what);
    }

## 控制语句

### for 循环

      function forLoopTest() public pure returns(uint256){
      uint sum = 0;
      for(uint i = 0; i < 10; i++){
      sum += i;
      }
      return(sum);
      }

### 插入排序

    // 插入排序 正确版
    function insertionSort(uint[] memory a) public pure returns(uint[] memory) {
        // note that uint can not take negative value
        for (uint i = 1;i < a.length;i++){
            uint temp = a[i];
            uint j=i;
            while( (j >= 1) && (temp < a[j-1])){
                a[j] = a[j-1];
                j--;
            }
            a[j] = temp;
        }
        return(a);
    }

## 构造函数和修饰器

- 是一种特殊的函数，每个合约可以定义一个，并在部署合约的时候自动运行一次。它可以用来初始化合约的一些参数. 一般是初始化 owner 或升级合约适用.

- modifier 的主要使用场景是运行函数前的检查，例如地址，变量，余额等。

  // 定义 modifier
  modifier onlyOwner {
  require(msg.sender == owner); // 检查调用者是否为 owner 地址
  \_; // 如果是的话，继续运行函数主体；否则报错并 revert 交易
  }

## 事件 -- 转账的 log

- Solidity 中的事件（event）是 EVM 上日志的抽象，它具有两个特点：
  - 响应：应用程序（ether.js）可以通过 RPC 接口订阅和监听这些事件，并在前端做响应。
  - 经济：事件是 EVM 上比较经济的存储数据的方式，每个大概消耗 2,000 gas；相比之下，链上存储一个新变量至少需要 20,000 gas。

## 继承规则

virtual: 父合约中的函数，如果希望子合约重写，需要加上 virtual 关键字。

override：子合约重写了父合约中的函数，需要加上 override 关键字。

## 抽象合约和接口

### 抽象合约

如果一个智能合约里至少有一个未实现的函数，即某个函数缺少主体{}中的内容，则必须将该合约标为 abstract，不然编译会报错；另外，未实现的函数需要加 virtual，以便子合约重写。拿我们之前的插入排序合约为例，如果我们还没想好具体怎么实现插入排序函数，那么可以把合约标为 abstract，之后让别人补写上。

      abstract contract InsertionSort{
          function insertionSort(uint[] memory a) public pure virtual returns(uint[] memory);
      }

### 接口

- 接口类似于抽象合约，但它不实现任何功能。接口的规则：
  - 不能包含状态变量
  - 不能包含构造函数
  - 不能继承除接口外的其他合约
  - 所有函数都必须是 external 且不能有函数体
  - 继承接口的合约必须实现接口定义的所有功能

接口与合约 ABI（Application Binary Interface）等价，可以相互转换：编译接口可以得到合约的 ABI，利用 abi-to-sol 工具也可以将 ABI json 文件转换为接口 sol 文件。

```
//接口和常规合约的区别在于每个函数都以;代替函数体{ }结尾。
interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);

    function ownerOf(uint256 tokenId) external view returns (address owner);

    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    function transferFrom(address from, address to, uint256 tokenId) external;

    function approve(address to, uint256 tokenId) external;

    function getApproved(uint256 tokenId) external view returns (address operator);

    function setApprovalForAll(address operator, bool _approved) external;

    function isApprovedForAll(address owner, address operator) external view returns (bool);

    function safeTransferFrom( address from, address to, uint256 tokenId, bytes calldata data) external;
}
```

### IERC721 事件

- IERC721 包含 3 个事件，其中 Transfer 和 Approval 事件在 ERC20 中也有。
  - Transfer 事件：在转账时被释放，记录代币的发出地址 from，接收地址 to 和 tokenid。
  - Approval 事件：在授权时释放，记录授权地址 owner，被授权地址 approved 和 tokenid。
  - ApprovalForAll 事件：在批量授权时释放，记录批量授权的发出地址 owner，被授权地址 operator 和授权与否的 approved。

### IERC721 函数

- balanceOf：返回某地址的 NFT 持有量 balance。
- ownerOf：返回某 tokenId 的主人 owner。
- transferFrom：普通转账，参数为转出地址 from，接收地址 to 和 tokenId。
- safeTransferFrom：安全转账（如果接收方是合约地址，会要求实现 ERC721Receiver 接口）。参数为转出地址 from，接收地址 to 和 tokenId。
- approve：授权另一个地址使用你的 NFT。参数为被授权地址 approve 和 tokenId。
- getApproved：查询 tokenId 被批准给了哪个地址。
- setApprovalForAll：将自己持有的该系列 NFT 批量授权给某个地址 operator。
- isApprovedForAll：查询某地址的 NFT 是否批量授权给了另一个 operator 地址。
- safeTransferFrom：安全转账的重载函数，参数里面包含了 data。

## 异常处理

error 是 solidity 0.8 版本新加的内容，方便且高效（省 gas）地向用户解释操作失败的原因。人们可以在 contract 之外定义异常。下面，我们定义一个 TransferNotOwner 异常，当用户不是代币 owner 的时候尝试转账，会抛出错误：

`error TransferNotOwner(); // 自定义error`

在执行当中，error 必须搭配 revert（回退）命令使用。

    function transferOwner1(uint256 tokenId, address newOwner) public {
        if(_owners[tokenId] != msg.sender){
            revert TransferNotOwner();
        }
        _owners[tokenId] = newOwner;
    }

### Require

require 命令是 solidity 0.8 版本之前抛出异常的常用方法，目前很多主流合约仍然还在使用它。它很好用，唯一的缺点就是 gas 随着描述异常的字符串长度增加，比 error 命令要高。使用方法：require(检查条件，"异常的描述")，当检查条件不成立的时候，就会抛出异常。

我们用 require 命令重写一下上面的 transferOwner 函数：

    function transferOwner2(uint256 tokenId, address newOwner) public {
        require(_owners[tokenId] == msg.sender, "Transfer Not Owner");//判断是否位owner
        _owners[tokenId] = newOwner;
    }

### Assert

assert 命令一般用于程序员写程序 debug，因为它不能解释抛出异常的原因（比 require 少个字符串）。它的用法很简单，`assert(检查条件）`，当检查条件不成立的时候，就会抛出异常。

我们用 assert 命令重写一下上面的 transferOwner 函数：

    function transferOwner3(uint256 tokenId, address newOwner) public {
        assert(_owners[tokenId] == msg.sender);
        _owners[tokenId] = newOwner;
    }

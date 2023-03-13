# 进阶课程

## 库函数

库函数是一种特殊的合约，为了提升 solidity 代码的复用性和减少 gas 而存在。库合约一般都是一些好用的函数合集（库函数），由大神或者项目方创作，咱们站在巨人的肩膀上，会用就行了。

主要减少工作和重复造轮子问题, 同时可以节省开发时间和安全性问题.

### String 库

String 库合约是将 uint256 类型转换为相应的 string 类型的代码库.

### 如何使用库合约

- 利用 using for 指令

      // 利用using for指令
      using Strings for uint256;
      function getString1(uint256 _number) public pure returns(string memory){
          // 库函数会自动添加为uint256型变量的成员

  return_number.toHexString();
  }

- 通过库合约名称调用库函数 - 看起来和其它的语言库没特别大区别

  // 直接通过库合约名调用
  function getString2(uint256 \_number) public pure returns(string memory){
  return Strings.toHexString(\_number);
  }

### 常用的库有

- [String](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/4a9cc8b4918ef3736229a5cc5a310bdc17bf759f/contracts/utils/Strings.sol)：将 uint256 转换为 String
- [Address](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/4a9cc8b4918ef3736229a5cc5a310bdc17bf759f/contracts/utils/Address.sol)：判断某个地址是否为合约地址
- [Create2](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/4a9cc8b4918ef3736229a5cc5a310bdc17bf759f/contracts/utils/Create2.sol)：更安全的使用 Create2 EVM opcode
- [Arrays](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/4a9cc8b4918ef3736229a5cc5a310bdc17bf759f/contracts/utils/Arrays.sol)：跟数组相关的库函数

## import

主要目的是模块化和工程化.

- 目录导入
- 远程导入 `import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol';`
- npm 导入 `import '@openzeppelin/contracts/access/Ownable.sol';`

## 接受 ETH

- Solidity 支持两种特殊的回调函数，receive()和 fallback()，他们主要在两种情况下被使用：
  - 接收 ETH
  - 处理合约中不存在的函数调用（代理合约 proxy contract）

**注意 ⚠️：在 solidity 0.6.x 版本之前，语法上只有 fallback() 函数，用来接收用户发送的 ETH 时调用以及在被调用函数签名没有匹配到时，来调用。 0.6 版本之后，solidity 才将 fallback() 函数拆分成 receive() 和 fallback() 两个函数。**

### receive()函数

receive()只用于处理接收 ETH。一个合约最多有一个 receive()函数，声明方式与一般函数不一样，不需要 function 关键字：`receive() external payable { ... }`。receive()函数不能有任何的参数，不能返回任何值，必须包含 external 和 payable。

当合约接收 ETH 的时候，receive()会被触发。receive()最好不要执行太多的逻辑因为如果别人用 send 和 transfer 方法发送 ETH 的话，gas 会限制在 2300，receive()太复杂可能会触发 Out of Gas 报错；如果用 call 就可以自定义 gas 执行更复杂的逻辑（这三种发送 ETH 的方法我们之后会讲到）。

    // 定义事件
    event Received(address Sender, uint Value);
    // 接收ETH时释放Received事件
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

### 回退函数 fallback()

fallback()函数会在调用合约不存在的函数时被触发。可用于接收 ETH，也可以用于代理合约 proxy contract。fallback()声明时不需要 function 关键字，必须由 external 修饰，一般也会用 payable 修饰，用于接收 ETH:`fallback() external payable { ... }`。

我们定义一个 fallback()函数，被触发时候会释放 fallbackCalled 事件，并输出`msg.sender，msg.value和msg.data`:

    // fallback
    fallback() external payable{
        emit fallbackCalled(msg.sender, msg.value, msg.data);
    }

### receive 和 fallback 的区别

      触发fallback() 还是 receive()?
                接收ETH
                    |
              msg.data是空？
                  /  \
                是    否
                /      \
      receive()存在?   fallback()
              / \
            是  否
            /     \
      receive()   fallback()

简单来说，合约接收 ETH 时，msg.data 为空且存在 receive()时，会触发 receive()；msg.data 不为空或不存在 receive()时，会触发 fallback()，此时 fallback()必须为 payable。

receive()和 payable fallback()均不存在的时候，向合约直接发送 ETH 将会报错（你仍可以通过带有 payable 的函数向合约发送 ETH）。

## 接收 ETH 合约

我们先部署一个接收 ETH 合约 ReceiveETH。ReceiveETH 合约里有一个事件 Log，记录收到的 ETH 数量和 gas 剩余。还有两个函数，一个是 receive()函数，收到 ETH 被触发，并发送 Log 事件；另一个是查询合约 ETH 余额的 getBalance()函数。

      contract ReceiveETH {
          // 收到eth事件，记录amount和gas
          event Log(uint amount, uint gas);

          // receive方法，接收eth时被触发
          receive() external payable{
              emit Log(msg.value, gasleft());
          }

          // 返回合约ETH余额
          function getBalance() view public returns(uint) {
              return address(this).balance;
          }
      }

### 转账 ETH 合约

Solidity 有三种发送 ETH 的方法：transfer，send 和 call。

- **call 没有 gas 限制，最为灵活，是最提倡的方法；**
- transfer 有 2300 gas 限制，但是发送失败会自动 revert 交易，是次优选择；
- send 有 2300 gas 限制，而且发送失败不会自动 revert 交易，几乎没有人用它。

我们将实现三种方法向 ReceiveETH 合约发送 ETH。首先，先在发送 ETH 合约 SendETH 中实现 payable 的构造函数和 receive()，让我们能够在部署时和部署后向合约转账。

      contract SendETH {
          // 构造函数，payable使得部署的时候可以转eth进去
          constructor() payable{}
          // receive方法，接收eth时被触发
          receive() external payable{}
      }

### transfer 方法

用法是接收方地址.transfer(发送 ETH 数额)。

transfer()的 gas 限制是 2300，足够用于转账，但对方合约的 fallback()或 receive()函数不能实现太复杂的逻辑。

transfer()如果转账失败，会自动 revert（回滚交易）。

代码样例，注意里面的 `_to` 填 `ReceiveETH` 合约的地址，amount 是 ETH 转账金额：

      // 用transfer()发送ETH
      function transferETH(address payable _to, uint256 amount) external payable{
          _to.transfer(amount);
      }

交易时 amount <= value, 否则转账失败，发生 revert，符合条件可转账成功。

### send

用法是接收方地址.send(发送 ETH 数额)。

send()的 gas 限制是 2300，足够用于转账，但对方合约的 fallback()或 receive()函数不能实现太复杂的逻辑。

**send()如果转账失败，不会 revert。**

send()的返回值是 bool，代表着转账成功或失败，需要额外代码处理一下。
代码样例：

      // send()发送ETH
      function sendETH(address payable _to, uint256 amount) external payable{
          // 处理下send的返回值，如果失败，revert交易并发送error
          bool success = _to.send(amount);
          if(!success){
              revert SendFailed();
          }
      }

交易时 amount <= value, 否则转账失败，因为经过处理，所以发生 revert。

### call - 主要选择方案

用法是接收方地址.call{value: 发送 ETH 数额}("")。

call()没有 gas 限制，可以支持对方合约 fallback()或 receive()函数实现复杂逻辑。

**call()如果转账失败，不会 revert。**

call()的返回值是(bool, data)，其中 bool 代表着转账成功或失败，需要额外代码处理一下。
代码样例：

      // call()发送ETH
      function callETH(address payable _to, uint256 amount) external payable{
          // 处理下call的返回值，如果失败，revert交易并发送error
          (bool success,) = _to.call{value: amount}("");
          if(!success){
              revert CallFailed();
          }
      }

交易时 amount <= value, 否则失败.

## 调用其他合约

一般构造函数传入合约地址,并调用当前合约提供的公开方法!

## Call 的使用

      contract OtherContract {
          uint256 private _x = 0; // 状态变量x
          // 收到eth的事件，记录amount和gas
          event Log(uint amount, uint gas);

          fallback() external payable{}

          // 返回合约ETH余额
          function getBalance() view public returns(uint) {
              return address(this).balance;
          }

          // 可以调整状态变量_x的函数，并且可以往合约转ETH (payable)
          function setX(uint256 x) external payable{
              _x = x;
              // 如果转入ETH，则释放Log事件
              if(msg.value > 0){
                  emit Log(msg.value, gasleft());
              }
          }

          // 读取x
          function getX() external view returns(uint x){
              x = _x;
          }
      }

语法: `目标合约地址.call{value:发送数额, gas:gas数额}(二进制编码);`

其中二进制编码利用结构化编码函数 `abi.encodeWithSignature` 获得：`abi.encodeWithSignature("函数签名", 逗号分隔的具体参数)` 其中函数签名为`"函数名（逗号分隔的参数类型)"`。例如`abi.encodeWithSignature("f(uint256,address)", _x, _addr)`。

      // 定义Response事件，输出call返回的结果success和data
      event Response(bool success, bytes data);
      function callSetX(address payable _addr, uint256 x) public payable {
        // call setX()，同时可以发送ETH
        (bool success, bytes memory data) = _addr.call{value: msg.value}(
            abi.encodeWithSignature("setX(uint256)", x)
        );
        emit Response(success, data); //释放事件
      }

2.`abi.decode` 来解码 call 的返回值 data

3.call 输入的函数不存在于目标合约，那么目标合约的 fallback 函数会被触发。

## delegatecall

主要有两个应用场景：

- 代理合约（Proxy Contract）：将智能合约的存储合约和逻辑合约分开：代理合约（Proxy Contract）存储所有相关的变量，并且保存逻辑合约的地址；所有函数存在逻辑合约（Logic Contract）里，通过 delegatecall 执行。当升级时，只需要将代理合约指向新的逻辑合约即可。

- EIP-2535 Diamonds（钻石）：钻石是一个支持构建可在生产中扩展的模块化智能合约系统的标准。钻石是具有多个实施合同的代理合同。 更多信息请查看：钻石标准简介。

## create 和 create2

有两种方法可以在合约中创建新合约，create 和 create2。

### create

create 的用法很简单，就是 new 一个合约，并传入新合约构造函数所需的参数：

`Contract x = new Contract{value: _value}(params)`

其中 Contract 是要创建的合约名，x 是合约对象（地址），如果构造函数是 payable，可以创建时转入\_value 数量的 ETH，params 是新合约构造函数的参数。

### CREATE2

- CREATE2 的目的是为了让合约地址独立于未来的事件。不管未来区块链上发生了什么，你都可以把合约部署在事先计算好的地址上。用 CREATE2 创建的合约地址由 4 个部分决定：
  - 0xFF：一个常数，避免和 CREATE 冲突
  - 创建者地址
  - salt（盐）：一个创建者给定的数值
  - 待部署合约的字节码（bytecode）

`新地址 = hash("0xFF",创建者地址, salt, bytecode)`

CREATE2 确保，如果创建者使用 CREATE2 和提供的 salt 部署给定的合约 bytecode，它将存储在 新地址 中。

### CREATE2 的用法

CREATE2 的用法和之前讲的 Create 类似，同样是 new 一个合约，并传入新合约构造函数所需的参数，只不过要多传一个 salt 参数：

`Contract x = new Contract{salt: _salt, value:_value}(params)`

其中 Contract 是要创建的合约名，x 是合约对象（地址），`_salt` 是指定的盐；如果构造函数是 payable，可以创建时转入`_value` 数量的 ETH，params 是新合约构造函数的参数。

## 删除智能合约

selfdestruct 命令可以用来删除智能合约，并将该合约剩余 ETH 转到指定地址。selfdestruct 是为了应对合约出错的极端情况而设计的。它最早被命名为 suicide（自杀），但是这个词太敏感。为了保护抑郁的程序员，改名为 selfdestruct。

### 如何使用

`selfdestruct(_addr)；//_addr是接收合约中剩余ETH的地址。`

## ABI 编码和解码

ABI (Application Binary Interface，应用二进制接口)是与以太坊智能合约交互的标准。数据基于他们的类型编码；并且由于编码后不包含类型信息，解码时需要注明它们的类型。

Solidity 中，ABI 编码有 4 个函数：`abi.encode, abi.encodePacked, abi.encodeWithSignature, abi.encodeWithSelector`。而 ABI 解码有 1 个函数：`abi.decode`，用于解码`abi.encode`的数据。

### ABI 编码

我们将用编码 4 个变量，他们的类型分别是`uint256, address, string, uint256[2]`：

    uint x = 10;
    address addr = 0x7A58c0Be72BE218B41C608b7Fe7C5bB630736C71;
    string name = "0xAA";
    uint[2] array = [5, 6];

将给定参数利用 ABI 规则编码。ABI 被设计出来跟智能合约交互，他将每个参数填充为 32 字节的数据，并拼接在一起。如果你要和合约交互，你要用的就是`abi.encode`。

    function encode() public view returns(bytes memory result) {
        result = abi.encode(x, addr, name, array);
    }

### 其它函数

省空间，并且不与合约交互的时候使用`abi.encodePacked`进行压缩

    function encodePacked() public view returns(bytes memory result) {
        result = abi.encodePacked(x, addr, name, array);
    }

调用其它合约的时候用 `abi.encodeWithSignature`

    function encodeWithSignature() public view returns(bytes memory result) {
        result = abi.encodeWithSignature("foo(uint256,address,string,uint256[2])", x, addr, name, array);
    }

`abi.encodeWithSelector` 和 `abi.encodeWithSignature`功能类似, 区别是第一个参数是函数选择器, 签名为 Keccak 哈希的前 4 个字节。

    function encodeWithSelector() public view returns(bytes memory result) {
        result = abi.encodeWithSelector(bytes4(keccak256("foo(uint256,address,string,uint256[2])")), x, addr, name, array);
    }

### ABI 解码

`abi.decode`用于解码`abi.encode`生成的二进制编码，将它还原成原本的参数。

    function decode(bytes memory data) public pure returns(uint dx, address daddr, string memory dname, uint[2] memory darray) {
        (dx, daddr, dname, darray) = abi.decode(data, (uint, address, string, uint[2]));
    }

## 哈希函数

### Keccak256

Keccak256 函数是 solidity 中最常用的哈希函数，用法非常简单：

`哈希 = keccak256(数据);`

### Keccak256 和 sha3

这是一个很有趣的事情：

sha3 由 keccak 标准化而来，在很多场合下 Keccak 和 SHA3 是同义词，但在 2015 年 8 月 SHA3 最终完成标准化时，NIST 调整了填充算法。所以 SHA3 就和 keccak 计算的结果不一样，这点在实际开发中要注意。

以太坊在开发的时候 sha3 还在标准化中，所以采用了 keccak，所以 Ethereum 和 Solidity 智能合约代码中的 SHA3 是指 Keccak256，而不是标准的 NIST-SHA3，为了避免混淆，直接在合约代码中写成 Keccak256 是最清晰的。

### 生成数据唯一标识

我们可以利用 keccak256 来生成一些数据的唯一标识。比如我们有几个不同类型的数据：uint，string，address，我们可以先用 abi.encodePacked 方法将他们打包编码，然后再用 keccak256 来生成唯一标识：

    function hash(
        uint _num,
        string memory _string,
        address _addr
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_num, _string, _addr));
    }

## selector

当我们调用智能合约时，本质上是向目标合约发送了一段 calldata，在 remix 中发送一次交易后，可以在详细信息中看见 input 即为此次交易的 calldata.

![](https://wtf.academy/assets/images/29-1-0cdac97a91d23b8b328265d1df3a56b5.png)

发送的 calldata 中前 4 个字节是 selector（函数选择器）。

### msg.data

msg.data 是 solidity 中的一个全局变量，值为完整的 calldata（调用函数时传入的数据）。

在下面的代码中，我们可以通过 Log 事件来输出调用 mint 函数的 calldata：

    // event 返回msg.data
    event Log(bytes data);

    function mint(address to) external{
        emit Log(msg.data);
    }

当参数为 0x2c44b726ADF1963cA47Af88B284C06f30380fC78 时，输出的 calldata 为

`0x6a6278420000000000000000000000002c44b726adf1963ca47af88b284c06f30380fc78`

这段很乱的字节码可以分成两部分：

- 前 4 个字节为函数选择器 selector：0x6a627842

- 后面 32 个字节为输入的参数：
  `0x0000000000000000000000002c44b726adf1963ca47af88b284c06f30380fc78`

其实 calldata 就是告诉智能合约，我要调用哪个函数，以及参数是什么。

### method id、selector 和函数签名

method id 定义为函数签名的 Keccak 哈希后的前 4 个字节，当 selector 与 method id 相匹配时，即表示调用该函数，那么函数签名是什么？

其实在第 21 讲中，我们简单介绍了函数签名，为`"函数名（逗号分隔的参数类型)"`。举个例子，上面代码中 mint 的函数签名为"mint(address)"。在同一个智能合约中，不同的函数有不同的函数签名，因此我们可以通过函数签名来确定要调用哪个函数。

注意，在函数签名中，uint 和 int 要写为 uint256 和 int256。

我们写一个函数，来验证 mint 函数的 method id 是否为 0x6a627842。大家可以运行下面的函数，看看结果。

    function mintSelector() external pure returns(bytes4 mSelector){
        return bytes4(keccak256("mint(address)"));
    }

结果正是 0x6a627842.

### 使用 selector

我们可以利用 selector 来调用目标函数。例如我想调用 mint 函数，我只需要利用`abi.encodeWithSelector`将 mint 函数的`method id`作为 selector 和参数打包编码，传给 call 函数：

    function callWithSignature() external returns(bool, bytes memory){
        (bool success, bytes memory data) = address(this).call(abi.encodeWithSelector(0x6a627842, "0x2c44b726ADF1963cA47Af88B284C06f30380fC78"));
        return(success, data);
    }

在日志中，我们可以看到 mint 函数被成功调用，并输出 Log 事件。

## try-catch

在 solidity 中，try-catch 只能被用于 external 函数或创建合约时 constructor（被视为 external 函数）的调用。基本语法如下：

        try externalContract.f() {
            // call成功的情况下 运行一些代码
        } catch {
            // call失败的情况下 运行一些代码
        }

其中 externalContract.f()是某个外部合约的函数调用，try 模块在调用成功的情况下运行，而 catch 模块则在调用失败时运行。

同样可以使用 this.f()来替代 externalContract.f()，this.f()也被视作为外部调用，但不可在构造函数中使用，因为此时合约还未创建。

如果调用的函数有返回值，那么必须在 try 之后声明 returns(returnType val)，并且在 try 模块中可以使用返回的变量；如果是创建合约，那么返回值是新创建的合约变量。

        try externalContract.f() returns(returnType val){
            // call成功的情况下 运行一些代码
        } catch {
            // call失败的情况下 运行一些代码
        }

另外，catch 模块支持捕获特殊的异常原因：

        try externalContract.f() returns(returnType){
            // call成功的情况下 运行一些代码
        } catch Error(string memory reason) {
            // 捕获失败的 revert() 和 require()
        } catch (bytes memory reason) {
            // 捕获失败的 assert()
        }

### try-catch 实战 -- Onlyeven

    contract OnlyEven{
        constructor(uint a){
            require(a != 0, "invalid number");
            assert(a != 1);
        }

        function onlyEven(uint256 b) external pure returns(bool success){
            // 输入奇数时revert
            require(b % 2 == 0, "Ups! Reverting");
            success = true;
        }
    }

    // 成功event
    event SuccessEvent();

    // 失败event
    event CatchEvent(string message);
    event CatchByte(bytes data);

    // 声明OnlyEven合约变量
    OnlyEven even;

    constructor() {
        even = new OnlyEven(2);
    }

        // 在external call中使用try-catch
    function execute(uint amount) external returns (bool success) {
        try even.onlyEven(amount) returns(bool _success){
            // call成功的情况下
            emit SuccessEvent();
            return _success;
        } catch Error(string memory reason){
            // call不成功的情况下
            emit CatchEvent(reason);
        }
    }

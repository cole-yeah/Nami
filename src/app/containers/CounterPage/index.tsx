import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useInjectReducer, useInjectSaga } from 'utils/redux-injectors';
import { useSelector, useDispatch } from 'react-redux';
import { sliceKey, reducer, actions } from './slice';
import { selectCounter, selectState } from './selector';
import { counterFromSaga } from './saga';
import { Button } from './components/Button';
import { Count } from './components/Count';
import { Flex } from './components/Flex';
import { fetchFunc } from './utils';

const Index = () => {
  useInjectReducer({ key: sliceKey, reducer: reducer });
  useInjectSaga({ key: sliceKey, saga: counterFromSaga });

  // const [number, setNumber] = useState<number>(0);
  const [ids, setIds] = useState<Array<string | number>>([0]);

  const counter = useSelector(selectCounter);
  const state = useSelector(selectState);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchFunc();
  }, []);

  useEffect(() => {
    setIds(prev => prev.concat(counter));
  }, [counter]);

  function clickFunc(type: string) {
    const actionName = type === 'plus' ? 'increment' : 'decrement';
    dispatch(actions[actionName]());
  }

  return (
    <Wrapper>
      <title>Home Page</title>
      <Flex>
        <Button onClick={() => clickFunc('minus')}>-</Button>
        <Count style={{ color: counter % 2 === 0 ? 'blue' : '#333' }}>
          {counter}
        </Count>
        <Button onClick={() => clickFunc('plus')}>+</Button>
      </Flex>
      <div>{state ? 'loading...' : 'success'}</div>
      <Button onClick={() => dispatch(actions.incrementAsync())}>
        延时500ms加一
      </Button>
      <div>{ids.join('-')}</div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 10px;
  width: 100%;
`;

export default Index;
